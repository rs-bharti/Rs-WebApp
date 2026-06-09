import React from 'react';
import { cn } from '../../lib/utils';

const Button = ({ className, variant = 'primary', disabled, ...props }) => {
  const variants = {
    primary:   'bg-brand-primary text-white hover:brightness-110 active:scale-[0.98] shadow-brand-card',
    secondary: 'bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary/5 active:scale-[0.98]',
    ghost:     'bg-transparent text-brand-primary hover:bg-brand-primary/5 border-none',
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        'px-6 py-3 text-[13px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-sm cursor-pointer',
        variants[variant],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    />
  );
};

export default Button;
