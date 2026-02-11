
import React, { useState, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Autocomplete from '../Shared/Autocomplete';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { ProStaff, ProSector, ProGroup, Unit, ProGroupLocation } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface PGMaestroProps {
  proData?: any;
}

const PGMaestro: React.FC<PGMaestroProps> = () => {
  const { showToast } = useToast();
  const { proSectors, proGroups, proGroupLocations, saveRecord, deleteRecord, mergePGs } = useApp();
  
  const activeUnit = Unit.HAP;
  const [viewMode, setViewMode] = useState<'maestro' | 'merge'>('maestro');
  const [selectedSectorName, setSelectedSectorName] = useState('');
  const [pgSearch, setPgSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{source: ProGroup, target: ProGroup} | null>(null);
  const [rowSearchValues, setRowSearchValues] = useState<Record<string, string>>({});

  const currentSector = useMemo(() => {
    return proSectors.find(s => s.name === selectedSectorName);
  }, [proSectors, selectedSectorName]);

  const sectorOptions = useMemo(() => {
    return proSectors
      .map(s => ({ value: s.name, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [proSectors]);

  const availablePGs = useMemo(() => {
    if (!currentSector) return proGroups.map(g => ({ value: g.name, label: g.name }));
    const linkedGroupIds = new Set(proGroupLocations.filter(loc => loc.sectorId === currentSector.id).map(loc => loc.groupId));
    return proGroups
        .filter(g => !linkedGroupIds.has(g.id))
        .map(g => ({ value: g.name, label: g.name }));
  }, [proGroups, proGroupLocations, currentSector]);

  const linkedPGs = useMemo(() => {
    if (!currentSector) return [];
    const relationships = proGroupLocations.filter(loc => loc.sectorId === currentSector.id);
    return relationships.map(rel => {
        const group = proGroups.find(g => g.id === rel.groupId);
        return {
            locationId: rel.id,
            groupName: group ? group.name : "PG Desconhecido",
            groupId: rel.groupId
        };
    }).sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [proGroupLocations, proGroups, currentSector]);

  const handleLinkPG = async (pgName: string) => {
    if (!currentSector || !currentSector.id) return;
    const group = proGroups.find(g => g.name === pgName);
    if (!group || !group.id) return;

    setIsSyncing(true);
    try {
        const newLink: ProGroupLocation = { id: crypto.randomUUID(), groupId: group.id, sectorId: currentSector.id, unit: activeUnit };
        await saveRecord('proGroupLocations', newLink);
        setPgSearch('');
        showToast("PG vinculado!", "success");
    } catch (e) { showToast("Falha.", "warning"); } 
    finally { setIsSyncing(false); }
  };

  const handleUnlinkPG = async (locationId: string) => {
    setIsSyncing(true);
    try { await deleteRecord('proGroupLocations', locationId); showToast("Vínculo removido.", "success"); } 
    finally { setIsSyncing(false); }
  };

  return (
    <section className="bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border-4 border-blue-900/30 space-y-10 animate-in fade-in duration-700 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/10 pb-10">
        <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-900/50">
                <i className={`fas ${isSyncing ? 'fa-circle-notch fa-spin' : 'fa-project-diagram'}`}></i>
             </div>
             <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Maestro HAP</h2>
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewMode('maestro')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${viewMode === 'maestro' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>Vínculos</button>
                  <span className="text-slate-700">|</span>
                  <button onClick={() => setViewMode('merge')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${viewMode === 'merge' ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}>Fusão</button>
                </div>
             </div>
          </div>
          <div className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Unidade Pênfigo</div>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-4">1. Selecionar Setor</label>
                <Autocomplete options={sectorOptions} value={selectedSectorName} onChange={setSelectedSectorName} placeholder="Pesquise o setor..." isStrict={true} className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] text-white font-black text-lg focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" />
            </div>
            <div className={`space-y-4 ${!selectedSectorName ? 'opacity-20' : ''}`}>
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-4">2. Vincular PG</label>
                <div className="flex gap-3">
                    <div className="flex-1"><Autocomplete options={availablePGs} value={pgSearch} onChange={setPgSearch} placeholder="Nome do PG..." className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] text-white font-black text-lg focus:border-blue-500 outline-none" /></div>
                    <button onClick={() => handleLinkPG(pgSearch)} disabled={!selectedSectorName || !pgSearch || isSyncing} className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl"><i className="fas fa-plus"></i></button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedPGs.map(item => (
                <div key={item.locationId} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-xl">
                    <span className="text-white font-black text-sm">{item.groupName}</span>
                    <button onClick={() => handleUnlinkPG(item.locationId)} disabled={isSyncing} className="text-slate-500 hover:text-rose-500"><i className="fas fa-times"></i></button>
                </div>
            ))}
          </div>
      </div>
    </section>
  );
};

export default PGMaestro;
