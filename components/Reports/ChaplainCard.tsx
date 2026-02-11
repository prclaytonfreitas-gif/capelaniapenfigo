
import React from 'react';

interface ChaplainCardProps {
  stat: any;
}

const ChaplainCard: React.FC<ChaplainCardProps> = ({ stat }) => {
  // A lógica agora foca apenas nos dados do Pênfigo (stats) fornecidos pelo Reports.tsx
  const data = stat.stats;

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col space-y-6 hover:border-blue-300 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl group-hover:scale-110 transition-transform">
          {stat.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter truncate">{stat.name}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Alunos HAP: {data.students}</span>
            <span className="text-[8px] font-black uppercase bg-slate-800 text-white px-2 py-0.5 rounded-md">{stat.totalActions} Ações Ativas</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl p-5 bg-blue-50 border border-slate-100/50">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Consolidado HAP</span>
            <span className="text-xs font-black text-slate-800">{data.total} Ações</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col text-center">
              <span className="text-[7px] font-bold text-slate-400 uppercase">Estudos</span>
              <span className="text-lg font-black text-slate-700">{data.studies}</span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-[7px] font-bold text-slate-400 uppercase">Classes</span>
              <span className="text-lg font-black text-slate-700">{data.classes}</span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-[7px] font-bold text-slate-400 uppercase">PGs</span>
              <span className="text-lg font-black text-slate-700">{data.groups}</span>
            </div>
            <div className="flex flex-col text-center bg-white/50 rounded-xl p-1">
              <span className="text-[7px] font-black uppercase text-rose-600">Visitas</span>
              <span className="text-lg font-black text-rose-700">{data.visits}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChaplainCard;
