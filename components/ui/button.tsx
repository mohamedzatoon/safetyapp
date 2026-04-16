import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
};

export function Button({ className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'outline'
      ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
      : 'bg-white text-slate-950 hover:bg-slate-100';

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
