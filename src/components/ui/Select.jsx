import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = ({ label, options = [], className, ...props }) => {
  return (
    <div className="relative border-b border-stone-300 pb-2 transition-colors focus-within:border-brand-primary">
      {label && (
        <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-3">
          {label}
        </label>
      )}
      <div className="flex items-center">
        <select
          className={cn(
            "w-full border-none p-0 focus:ring-0 text-[15px] text-stone-800 bg-transparent appearance-none cursor-pointer outline-none",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-stone-400 ml-2 pointer-events-none" />
      </div>
    </div>
  );
};

export default Select;
