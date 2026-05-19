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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Total</span>
              <span className="block text-xs font-bold text-white">
                {formatBillions(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {data.map((item, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
              </div>
              <div className="text-lg font-black text-white">{formatBillions(item.value)}</div>
              <div className="text-[10px] text-slate-500 font-medium">Realisasi Akumulasi</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
