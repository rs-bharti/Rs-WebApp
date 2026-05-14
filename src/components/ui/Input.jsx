import React from 'react';
import { cn } from '../../lib/utils';

const Input = ({ label, className, type = 'text', ...props }) => {
  return (
    <div className="relative border-b border-stone-300 pb-2 transition-colors focus-within:border-brand-primary">
      {label && (
        <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-3">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "w-full border-none p-0 focus:ring-0 text-[15px] text-stone-800 bg-transparent placeholder:text-stone-300 outline-none",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;
