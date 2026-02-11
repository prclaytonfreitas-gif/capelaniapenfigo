
import React from 'react';

interface ChaplainStatCardProps {
  stat: {
    name: string;
    ham: { total: number; studies: number; classes: number; visits: number; groups: number };
    maxVal: number;
  };
  primaryColor: string;
}

const ChaplainStatCard: React.FC<ChaplainStatCardProps> = ({ stat, primaryColor }) => {
  const data = stat.ham;
  
  return (
    <div className="p-5 rounded-[2rem] bg-white border border-slate-100 h-full flex flex-col justify-between shadow-sm" style={{ breakInside: 'avoid' }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-black text-slate-800 uppercase tracking-tighter truncate max-w-[150px]" title={stat.name}>
          {stat.name}
        </span>
        <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-lg">
          {data.total} Ações HAM
        </span>
      </div>
      
      <div className="flex gap-3 flex-1">
        <div className="flex-1 rounded-2xl p-4 bg-blue-50 border border-slate-100/50 flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-black/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Hospital Manaus</span>
            <span className="text-xs font-black text-slate-800">{data.total}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
             {[
               { label: 'Estudos', val: data.studies },
               { label: 'Classes', val: data.classes },
               { label: 'Visitas', val: data.visits },
               { label: 'PGs', val: data.groups }
             ].map((metric, i) => (
               <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${metric.val > 0 ? 'bg-white/80' : 'opacity-40'}`}>
                 <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{metric.label}</span>
                 <span className="text-[10px] font-black text-slate-700">{metric.val}</span>
               </div>
             ))}
          </div>
          {data.total === 0 && <span className="text-[8px] text-slate-400 italic text-center block pt-2">Sem atividades este mês</span>}
        </div>
      </div>
    </div>
  );
};

export default ChaplainStatCard;
