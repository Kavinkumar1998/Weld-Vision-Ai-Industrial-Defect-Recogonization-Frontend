import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';
import { WeldVerdict } from '../../types/detection';

interface VerdictBadgeProps {
  verdict: WeldVerdict;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  confidence,
  size = 'md'
}) => {
  const isGood = verdict === 'GOOD';
  const isDefective = verdict === 'DEFECTIVE';
  const isNoWeld = verdict === 'NO_WELD_DETECTED';

  let bgClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <HelpCircle className="w-5 h-5" />;
  let label = 'UNKNOWN';

  if (isGood) {
    bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10';
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    label = 'PASS — GOOD WELD';
  } else if (isDefective) {
    bgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/10';
    icon = <AlertTriangle className="w-5 h-5 text-rose-400" />;
    label = 'FAIL — DEFECTIVE WELD';
  } else if (isNoWeld) {
    bgClass = 'bg-slate-800/80 text-slate-400 border-slate-700';
    icon = <XCircle className="w-5 h-5 text-slate-400" />;
    label = 'NO WELD DETECTED';
  }

  const sizeClass = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3'
  }[size];

  return (
    <div className={`inline-flex items-center font-bold rounded-xl border ${sizeClass} ${bgClass}`}>
      {icon}
      <span>{label}</span>
      {confidence > 0 && (
        <span className="ml-2 font-mono text-xs opacity-80 px-2 py-0.5 rounded bg-black/20">
          {(confidence * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
};
