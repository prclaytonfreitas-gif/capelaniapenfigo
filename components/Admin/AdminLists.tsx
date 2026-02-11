
import React, { useRef, useState, useMemo } from 'react';
import * as Xlsx from 'xlsx';
import { useToast } from '../../contexts/ToastContext';
import PGMaestro from './PGMaestro';
import { ProStaff, ProSector, ProGroup, Unit } from '../../types';
import SyncModal, { SyncStatus } from '../Shared/SyncModal';
import Autocomplete from '../Shared/Autocomplete';
import { normalizeString, cleanID } from '../../utils/formatters';

interface AdminListsProps {
  proData?: { staff: ProStaff[]; sectors: ProSector[]; groups: ProGroup[] };
  onSavePro?: (staff: ProStaff[], sectors: ProSector[], groups: ProGroup[]) => Promise<boolean>;
}

interface PreviewItem {
  id: string; 
  name: string;
  unit: Unit;
  sectorIdRaw?: string; 
  sectorNameRaw?: string; 
  sectorIdLinked?: string | null; 
  sectorStatus?: 'ok' | 'error' | 'new'; 
  linkedSectorName?: string;
}

const AdminLists: React.FC<AdminListsProps> = ({ proData, onSavePro }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'staff' | 'sectors' | 'pgs'>('staff');
  const activeUnit = Unit.HAP; // Unidade Fixa
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [syncState, setSyncState] = useState<{isOpen: boolean; status: SyncStatus; title: string; message: string; error?: string;}>({ isOpen: false, status: 'idle', title: '', message: '' });
  
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeHeader = (h: string) => 
    String(h || '')
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,º°ª#]/g, "")
      .replace(/\s+/g, " ");

  const findColumnIndex = (headers: string[], synonyms: string[]) => {
      let idx = headers.findIndex(h => synonyms.some(s => h === s));
      if (idx !== -1) return idx;
      return headers.findIndex(h => synonyms.some(s => h.includes(s)));
  };

  const sectorOptions = useMemo(() => {
      if (!proData) return [];
      return proData.sectors
        .map(s => ({ 
            value: s.name, 
            label: `${s.id} - ${s.name}`, 
            subLabel: s.name,
            category: 'RH' as const 
        }));
  }, [proData]);

  const validateSheetType = (headers: string[], tab: string): boolean => {
      const hasStaffCols = headers.some(h => h.includes('MATRICULA') || h.includes('CRACHA') || h.includes('FUNCIONARIO') || h.includes('COLABORADOR'));
      const hasSectorCols = headers.some(h => h.includes('DEPARTAMENTO') || (h.includes('SETOR') && !h.includes('ID')) || h.includes('CENTRO DE CUSTO'));
      const hasID = headers.some(h => h.includes('ID') || h.includes('COD'));
      const hasPGIdentifier = headers.some(h => h.includes('PG') || h.includes('GRUPO') || h.includes('NOME') || h.includes('LIDER'));

      if (tab === 'staff' && !hasStaffCols) {
          showToast("Arquivo inválido para Colaboradores.", "warning");
          return false;
      }
      if (tab === 'sectors' && (!hasSectorCols || hasStaffCols)) {
          showToast("Arquivo inválido para Setores.", "warning");
          return false;
      }
      if (tab === 'pgs' && (!hasID || !hasPGIdentifier || hasStaffCols || hasSectorCols)) {
          showToast("Arquivo inválido para PGs.", "warning");
          return false;
      }
      return true;
  };

  const processFile = (file: File) => {
    setIsProcessingFile(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = Xlsx.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = Xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        if (allRows.length < 2) {
          showToast("Planilha vazia ou inválida.", "warning");
          setIsProcessingFile(false);
          return;
        }

        let dataStartRow = -1;
        let headers: string[] = [];

        for(let i = 0; i < Math.min(allRows.length, 50); i++){
            const row = allRows[i].map(c => normalizeHeader(String(c)));
            const hasKeywords = row.some(cell => 
                cell.includes('SETOR') || cell.includes('MATRICULA') || 
                cell.includes('CRACHA') || cell.includes('PG') || 
                cell.includes('GRUPO') || cell.includes('DEPARTAMENTO') || cell.includes('ID') || cell.includes('NOME')
            );
            if(hasKeywords){ headers = row; dataStartRow = i + 1; break; }
        }
        
        if (dataStartRow === -1) {
            showToast("Não foi possível identificar as colunas.", "warning");
            setIsProcessingFile(false);
            return;
        }

        if (!validateSheetType(headers, activeTab)) {
            setIsProcessingFile(false);
            return;
        }

        const dataRows = allRows.slice(dataStartRow);
        const idxId = findColumnIndex(headers, ['ID', 'COD', 'MATRICULA', 'MAT', 'CRACHA', 'REGISTRO']);
        const idxName = findColumnIndex(headers, ['NOME', 'COLABORADOR', 'FUNCIONARIO', 'SETOR', 'PG', 'GRUPO', 'DESCRIÇÃO']);
        const idxSecId = findColumnIndex(headers, ['ID SETOR', 'COD SETOR', 'COD DEPARTAMENTO', 'CODIGO SETOR']);
        const idxSecName = findColumnIndex(headers, ['NOME SETOR', 'SETOR', 'DEPARTAMENTO']);

        if (idxId === -1 || idxName === -1) {
            showToast("Colunas obrigatórias não encontradas.", "warning");
            setIsProcessingFile(false);
            return;
        }

        const seenIds = new Set<string>();
        const res: PreviewItem[] = [];

        dataRows.forEach(row => {
            const rawId = cleanID(row[idxId]); 
            const name = String(row[idxName]||'').trim();
            const finalId = rawId || (activeTab === 'pgs' ? cleanID(name) : ''); 

            if(!finalId || seenIds.has(finalId)) return;
            seenIds.add(finalId);

            const item: PreviewItem = { id: finalId, name: name, unit: activeUnit, sectorStatus: 'ok' };

            if (activeTab === 'staff') {
                const sIdRaw = row[idxSecId] ? cleanID(row[idxSecId]) : '';
                const sNameRaw = row[idxSecName] ? String(row[idxSecName]).trim() : '';
                item.sectorIdRaw = sIdRaw;
                item.sectorNameRaw = sNameRaw;
                
                let match = null;
                if (sIdRaw && proData) {
                    match = proData.sectors.find(s => cleanID(s.id) === sIdRaw);
                }
                if (!match && sNameRaw && proData) {
                    const norm = normalizeString(sNameRaw);
                    match = proData.sectors.find(s => normalizeString(s.name) === norm);
                }

                if (match) {
                    item.sectorIdLinked = match.id;
                    item.linkedSectorName = match.name;
                    item.sectorStatus = 'ok';
                } else {
                    item.sectorStatus = 'error'; 
                }
            }
            res.push(item);
        });

        setPreviewData(res);
        setCurrentPage(1);
        showToast(`${res.length} registros lidos.`, "success");

      } catch (err) {
        showToast("Erro ao processar arquivo.", "warning");
      } finally {
        setIsProcessingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!proData || !onSavePro) return;
    setSyncState({ isOpen: true, status: 'processing', title: 'Sincronizando', message: 'Gravando dados no Pênfigo...' });
    
    try {
        let stats = { updated: 0, deactivated: 0, new: 0 };
        const mergeData = (currentDB: any[], incomingList: PreviewItem[], type: 'staff'|'sector'|'pg') => {
            const map = new Map<string, any>();
            currentDB.forEach(item => map.set(cleanID(item.id), item));

            incomingList.forEach(incoming => {
                const key = incoming.id; 
                const existing = map.get(key);
                if (existing) {
                    map.set(key, { ...existing, name: incoming.name, active: true, updatedAt: Date.now(), sectorId: type === 'staff' ? (incoming.sectorIdLinked || existing.sectorId || "") : undefined });
                    stats.updated++;
                } else {
                    const newItem: any = { id: key, name: incoming.name, unit: activeUnit, active: true, updatedAt: Date.now() };
                    if (type === 'staff') newItem.sectorId = incoming.sectorIdLinked || "";
                    map.set(key, newItem);
                    stats.new++;
                }
            });

            const incomingKeys = new Set(incomingList.map(i => i.id));
            const resultList: any[] = [];
            map.forEach((value, key) => {
                if (!incomingKeys.has(key)) {
                    if (value.active !== false) { value.active = false; stats.deactivated++; }
                }
                resultList.push(value);
            });
            return resultList;
        };

        if (activeTab === 'staff') {
            await onSavePro(mergeData(proData.staff, previewData, 'staff'), proData.sectors, proData.groups);
        } else if (activeTab === 'sectors') {
            await onSavePro(proData.staff, mergeData(proData.sectors, previewData, 'sector'), proData.groups);
        } else if (activeTab === 'pgs') {
            await onSavePro(proData.staff, proData.sectors, mergeData(proData.groups, previewData, 'pg'));
        }

        setSyncState({ isOpen: true, status: 'success', title: 'Sincronização HAP', message: `Sucesso!\n\nNovos/Atualizados: ${stats.updated + stats.new}\nInativos: ${stats.deactivated}` });
        setPreviewData([]); 
    } catch (e: any) {
        setSyncState({ isOpen: true, status: 'error', title: 'Erro ao Salvar', message: "Falha na sincronização.", error: e.message });
    }
  };

  const displayData = useMemo(() => {
      let source: any[] = [];
      if (previewData.length > 0) return previewData;
      if (proData) {
          if (activeTab === 'staff') source = proData.staff.filter(s => s.active !== false);
          else if (activeTab === 'sectors') source = proData.sectors.filter(s => s.active !== false);
          else source = proData.groups.filter(s => s.active !== false);
      }
      return source.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [previewData, proData, activeTab]);

  const currentItems = displayData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-12">
      <SyncModal isOpen={syncState.isOpen} status={syncState.status} title={syncState.title} message={syncState.message} errorDetails={syncState.error} onClose={() => setSyncState(prev => ({ ...prev, isOpen: false }))} />
      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Importação HAP (Pênfigo)</h2>
          <div className="bg-blue-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-blue-600 border border-blue-100">Unidade Pênfigo (Ativa)</div>
        </div>
        <div className="flex gap-4 border-b overflow-x-auto no-scrollbar">
            {[ {id:'sectors', l:'1. Setores', i:'fa-map-marker-alt'}, {id:'staff', l:'2. Colaboradores', i:'fa-user-md'}, {id:'pgs', l:'3. PGs', i:'fa-users'} ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setPreviewData([]); setCurrentPage(1); }} className={`pb-4 px-4 text-xs font-black uppercase flex items-center gap-2 border-b-4 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-300'}`}><i className={`fas ${tab.i}`}></i> {tab.l}</button>
            ))}
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <input type="file" ref={fileInputRef} accept=".xlsx,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessingFile} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-black transition-all">
                    <i className={`fas ${isProcessingFile ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i> {isProcessingFile ? 'Lendo...' : 'Carregar Planilha'}
                </button>
                <div className="text-xs font-bold text-slate-400">{previewData.length > 0 ? <span className="text-blue-600">{previewData.length} registros.</span> : <span>Banco: {displayData.length} ativos</span>}</div>
            </div>
            {previewData.length > 0 && (
                <button onClick={handleConfirmImport} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-2">
                    <i className="fas fa-sync"></i> Sincronizar HAP
                </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-400 border-b"><th className="p-4">ID</th><th className="p-4">Nome</th>{activeTab === 'staff' && <th className="p-4">Vínculo</th>}</tr>
                </thead>
                <tbody className="divide-y">
                    {currentItems.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-xs font-mono font-bold text-blue-600">{item.id}</td>
                            <td className="p-4 text-sm font-bold text-slate-700">{item.name}</td>
                            {activeTab === 'staff' && <td className="p-4 text-[10px] font-bold uppercase text-slate-500">{(item as any).linkedSectorName || (item as any).sectorNameRaw || 'Pendente'}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>
      <PGMaestro />
    </div>
  );
};

export default AdminLists;
