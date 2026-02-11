
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, Legend, YAxis } from 'recharts';

interface ImpactChartsProps {
  individualData: any[];
  globalData: any;
}

const ImpactCharts: React.FC<ImpactChartsProps> = ({ individualData, globalData }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir que o container DOM esteja com tamanho calculado
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* Gráfico Individual */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tighter">
          <i className="fas fa-chart-bar text-blue-600"></i> Desempenho Individual
        </h3>
        <div className="h-[250px] w-full min-h-[250px] relative">
          {isReady ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={individualData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '1rem', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="val" radius={[10, 10, 0, 0]} barSize={40}>
                  { individualData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#6366f1', '#10b981', '#f43f5e'][i]} />) }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-2xl">
              <i className="fas fa-circle-notch fa-spin text-blue-200 text-2xl"></i>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Impacto Global */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
              <i className="fas fa-globe-americas text-[#005a9c]"></i> Impacto Global (Equipe)
            </h3>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
              Comparativo de Metas Mensais
            </p>
          </div>
          <div className={`px-5 py-2 rounded-2xl flex items-center gap-2 border ${globalData.isUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <i className={`fas fa-arrow-${globalData.isUp ? 'up' : 'down'} text-[10px]`}></i>
            <span className="text-[11px] font-black uppercase tracking-widest">{globalData.isUp ? '+' : ''}{globalData.pct}% alcance</span>
          </div>
        </div>

        <div className="h-[320px] w-full min-h-[320px] relative">
          {isReady ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart 
                data={globalData.chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 9, fontWeight: 900}} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.03)'}} 
                  contentStyle={{borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px', background: '#ffffff'}} 
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={40} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px' }}
                />
                <Bar 
                  name="Mês Anterior" 
                  dataKey="anterior" 
                  radius={[6, 6, 0, 0]} 
                  barSize={18}
                >
                  {globalData.chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-prev-${index}`} 
                      fill={entry.atual >= entry.anterior ? '#10b981' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
                <Bar 
                  name="Mês Atual" 
                  dataKey="atual" 
                  fill="#005a9c" 
                  radius={[6, 6, 0, 0]} 
                  barSize={18} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-2xl">
               <i className="fas fa-circle-notch fa-spin text-blue-200 text-2xl"></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactCharts;
