import React from 'react';
import { cn } from '../../lib/utils';

const Button = ({ className, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-card',
    secondary: 'bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary/5',
    ghost: 'bg-transparent text-brand-primary hover:bg-brand-primary/5 border-none'
  };

  return (
    <button
      className={cn(
        'px-6 py-3 text-[13px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-sm cursor-pointer',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export default Button;
