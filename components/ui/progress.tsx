import * as React from 'react';

export function Progress({ value = 0, className = '' }: { value?: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
