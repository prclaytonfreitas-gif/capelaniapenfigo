
import React, { useState, useEffect } from 'react';
import { Unit } from '../../types';
import PGDashboard from './PGDashboard';
import PGMembership from './PGMembership';
import PGReports from './PGReports';
import PGMaestro from '../Admin/PGMaestro';
import PGOps from './PGOps';

const PGManagerLayout: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'membership' | 'structure' | 'ops' | 'reports'>('dashboard');
  const [currentUnit] = useState<Unit>(Unit.HAP); // Fixado em HAP

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSubTab]);

  const tabs = [
    { id: 'dashboard', label: 'Visão Geral', icon: 'fas fa-chart-pie' },
    { id: 'membership', label: 'Matrícula', icon: 'fas fa-user-plus' },
    { id: 'structure', label: 'Cadastros', icon: 'fas fa-sitemap' },
    { id: 'ops', label: 'Agenda PG', icon: 'fas fa-calendar-check' },
    { id: 'reports', label: 'Relatórios', icon: 'fas fa-print' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      <div className="sticky top-[-1rem] md:top-[-2rem] z-[100] -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-[#f1f5f9]/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#005a9c] rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-xl shadow-lg shadow-blue-900/20">
                <i className="fas fa-project-diagram"></i>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                  Gestão Estratégica
                </h1>
                <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">
                  Discipulado e Pequenos Grupos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-black text-[10px] uppercase text-blue-700 tracking-widest">Hospital Adventista do Pênfigo - HAP</span>
            </div>
          </header>

          <nav className="flex overflow-x-auto no-scrollbar gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all whitespace-nowrap ${
                  activeSubTab === tab.id 
                    ? 'bg-white border-[#005a9c] text-[#005a9c] shadow-md scale-105' 
                    : 'bg-white/50 border-transparent text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
              >
                <i className={`${tab.icon} text-xs md:text-sm`}></i>
                <span className="text-[9px] md:text-xs font-black uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto min-h-[500px]">
        <main className="animate-in fade-in slide-in-from-top-2 duration-500">
          {activeSubTab === 'dashboard' && <PGDashboard unit={currentUnit} />}
          {activeSubTab === 'membership' && <PGMembership unit={currentUnit} />}
          {activeSubTab === 'structure' && (
             <div className="space-y-4">
               <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4 items-center mb-4">
                   <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-xl flex items-center justify-center text-xl">
                       <i className="fas fa-info-circle"></i>
                   </div>
                   <div>
                       <h4 className="font-black text-amber-800 text-sm uppercase">Gerenciamento Estrutural</h4>
                       <p className="text-xs text-amber-700/70">Use esta ferramenta para criar novos PGs, fundir duplicatas e definir quais setores cada PG atende.</p>
                   </div>
               </div>
               <PGMaestro />
             </div>
          )}
          {activeSubTab === 'ops' && <PGOps unit={currentUnit} />}
          {activeSubTab === 'reports' && <PGReports unit={currentUnit} />}
        </main>
      </div>
    </div>
  );
};

export default PGManagerLayout;
