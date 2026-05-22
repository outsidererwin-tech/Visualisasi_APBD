import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { formatBillions, formatPercentage } from '../../lib/formatters';

export function StatCard({ title, value, icon, color, percentage, progressBar }: { 
  title: string; 
  value: string; 
  icon: ReactNode; 
  color: 'indigo' | 'emerald' | 'rose';
  percentage?: number;
  progressBar?: number;
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 ring-indigo-500/5 shadow-indigo-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/5 shadow-emerald-500/10',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 ring-rose-500/5 shadow-rose-500/10'
  };

  const accentColors = {
    indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="bg-white/5 backdrop-blur-md p-7 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl border ring-8 transition-all group-hover:rotate-6 group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {percentage !== undefined && (
          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">LIVE SYNC</span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 truncate">{title}</p>
        {(() => {
          const valLen = value.length;
          const cardFontSize = Math.min(30, Math.max(14, 520 / valLen));
          return (
            <h4 
              className="font-black tracking-tight text-white leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ fontSize: `${cardFontSize}px` }}
            >
              {value}
            </h4>
          );
        })()}
      </div>
      
      {progressBar !== undefined && (
        <div className="mt-6">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
            <span>Utilization Rate</span>
            <span>{formatPercentage(progressBar)}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressBar, 100)}%` }}
              className={cn("h-full rounded-full", accentColors[color])}
            />
          </div>
        </div>
      )}

      <div className={cn("absolute -right-8 -bottom-8 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-opacity group-hover:opacity-30", 
        color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500')} />
    </motion.div>
  );
}
