import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { formatBillions } from '../../lib/formatters';

interface CompositionSummaryProps {
  data: any[];
  selectedMonth: string;
}

export function CompositionSummary({ data, selectedMonth }: CompositionSummaryProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-8"
      >
        <div className="flex-shrink-0 w-full md:w-64">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
            <span>Komposisi APBD</span>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-400 capitalize">{selectedMonth}</span>
          </h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={data.filter(item => item.value > 0).length > 1 ? 5 : 0}
                  dataKey="value"
                >
                  {data.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1e293b]/90 backdrop-blur-xl p-3 shadow-2xl border border-white/10 rounded-xl">
                          <p className="text-xs font-bold text-white mb-1">{payload[0].name}</p>
                          <p className="text-[10px] font-mono text-slate-300">{formatBillions(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {(() => {
              const formattedTotal = formatBillions(total);
              const totalLength = formattedTotal.length;
              const totalFontSize = Math.min(12, Math.max(7.5, 188 / totalLength));
              return (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[112px] flex flex-col items-center justify-center">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Total</span>
                  <span 
                    className="block font-bold text-white tracking-tighter leading-none whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ fontSize: `${totalFontSize}px` }}
                  >
                    {formattedTotal}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {data.map((item, i) => {
            const valStr = formatBillions(item.value);
            const valLen = valStr.length;
            const itemFontSize = Math.min(18, Math.max(10, 320 / valLen));
            return (
              <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.name}</span>
                  </div>
                  <div 
                    className="font-black text-white tracking-tight leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ fontSize: `${itemFontSize}px` }}
                  >
                    {valStr}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">Realisasi Akumulasi</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
