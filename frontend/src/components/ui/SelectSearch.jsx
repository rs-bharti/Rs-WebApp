import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Searchable replacement for <select>.
 *
 * Props:
 *   value       – currently selected id (string or number)
 *   onChange    – called with the selected id as a string
 *   options     – [{ id, name, label? }]  label shown in list, name shown when selected
 *   placeholder – text shown when nothing selected
 *   variant     – 'underline' (default, border-b style) | 'inline' (table-cell, no border)
 *   disabled    – boolean
 */
const SelectSearch = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  variant = 'underline',
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef(null);
  const inputRef          = useRef(null);

  const selected = options.find(o => String(o.id) === String(value));

  const filtered = (() => {
    if (!query) return options;
    const q = query.toLowerCase();
    const starts   = options.filter(o => (o.name || '').toLowerCase().startsWith(q));
    const contains = options.filter(o => !(o.name || '').toLowerCase().startsWith(q) && (o.name || '').toLowerCase().includes(q));
    return [...starts, ...contains];
  })();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (option) => {
    onChange(String(option.id));
    setOpen(false);
    setQuery('');
  };

  const dropdown = open && (
    <div className="absolute z-[60] top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-stone-100 bg-stone-50">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full text-xs bg-transparent outline-none font-medium placeholder:text-stone-400"
        />
      </div>
      <ul className="max-h-52 overflow-y-auto">
        {filtered.length === 0
          ? <li className="px-4 py-3 text-xs text-stone-400 italic">No results</li>
          : filtered.map(o => (
            <li
              key={o.id}
              onMouseDown={() => handleSelect(o)}
              className={cn(
                'px-4 py-2.5 text-sm cursor-pointer hover:bg-stone-50 transition-colors truncate',
                String(o.id) === String(value) && 'bg-rs-text-primary/5 font-semibold text-rs-text-primary'
              )}
            >
              {o.label || o.name}
            </li>
          ))
        }
      </ul>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="relative flex items-center cursor-pointer" ref={containerRef} onClick={handleOpen}>
        <span className={cn('flex-1 text-sm font-medium truncate', !selected && 'text-stone-400')}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        {dropdown}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative border-b pb-1 transition-colors flex items-center gap-1',
        open ? 'border-rs-text-primary' : 'border-stone-200',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {open ? (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search…"
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
        />
      ) : (
        <div
          className="flex-1 text-sm font-medium cursor-pointer truncate select-none"
          onClick={handleOpen}
        >
          {selected
            ? <span>{selected.name}</span>
            : <span className="text-stone-400">{placeholder}</span>
          }
        </div>
      )}
      <ChevronDown
        onClick={handleOpen}
        className={cn('w-4 h-4 text-stone-400 flex-shrink-0 cursor-pointer transition-transform duration-200', open && 'rotate-180')}
      />
      {dropdown}
    </div>
  );
};

export default SelectSearch;
