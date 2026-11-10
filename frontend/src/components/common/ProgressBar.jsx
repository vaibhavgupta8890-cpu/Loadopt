import React from 'react';

export const ProgressBar = ({ percentage = 0, label, current, max, unit = '', showLabel = true, height = 'h-2.5' }) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  // Dynamic color coding based on threshold
  let barColor = 'bg-blue-600';
  let badgeColor = 'text-blue-700 bg-blue-50';

  if (clamped >= 95) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50';
  } else if (clamped >= 80) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50';
  } else if (clamped > 0) {
    barColor = 'bg-emerald-500';
    badgeColor = 'text-emerald-700 bg-emerald-50';
  } else {
    barColor = 'bg-slate-300';
    badgeColor = 'text-slate-600 bg-slate-50';
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-700">{label}</span>
          <div className="flex items-center gap-2">
            {current !== undefined && max !== undefined && (
              <span className="text-slate-500">
                {current} / {max} {unit}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded font-semibold ${badgeColor}`}>
              {clamped.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
