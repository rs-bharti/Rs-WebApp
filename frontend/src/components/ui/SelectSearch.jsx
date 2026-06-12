import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const SelectSearch = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  variant = 'underline',
}) => {
  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState('');
  const [pos,         setPos]         = useState({ top: 0, left: 0, width: 0 });
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef                  = useRef(null);
  const inputRef                      = useRef(null);
  const listRef                       = useRef(null);

  const selected = options.find(o => String(o.id) === String(value));

  const filtered = (() => {
    if (!query) return options;
    const q = query.toLowerCase();
    const starts   = options.filter(o => (o.name || '').toLowerCase().startsWith(q));
    const contains = options.filter(o => !(o.name || '').toLowerCase().startsWith(q) && (o.name || '').toLowerCase().includes(q));
    return [...starts, ...contains];
  })();

  const calcPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setQuery('');
    setHighlighted(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHighlighted(-1);
    containerRef.current?.focus();
  }, []);

  const handleSelect = (option) => {
    onChange(String(option.id));
    setOpen(false);
    setQuery('');
    setHighlighted(-1);
    setTimeout(() => containerRef.current?.focus(), 0);
  };

  // Reset highlight when query changes
  useEffect(() => { setHighlighted(-1); }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('li[data-opt]');
    if (items[highlighted]) items[highlighted].scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const handler = () => calcPos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, calcPos]);

  // Keyboard handler when dropdown search input is focused
  const handleInputKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted(i => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted(i => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlighted >= 0 && filtered[highlighted]) {
          handleSelect(filtered[highlighted]);
        } else if (filtered.length === 1) {
          handleSelect(filtered[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        // Close and let focus move naturally
        setOpen(false);
        setQuery('');
        setHighlighted(-1);
        break;
      default:
        break;
    }
  };

  // Keyboard handler for the trigger (when closed)
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleOpen();
    }
  };

  const dropdownPortal = open ? createPortal(
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 200), zIndex: 9999 }}
      className="bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-stone-100 bg-stone-50">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search…"
          className="w-full text-xs bg-transparent outline-none font-medium placeholder:text-stone-400"
        />
      </div>
      <ul ref={listRef} className="max-h-52 overflow-y-auto" role="listbox">
        {filtered.length === 0
          ? <li className="px-4 py-3 text-xs text-stone-400 italic">No results</li>
          : filtered.map((o, idx) => (
            <li
              key={o.id}
              data-opt
              role="option"
              aria-selected={String(o.id) === String(value)}
              onMouseDown={() => handleSelect(o)}
              className={cn(
                'px-4 py-2.5 text-sm cursor-pointer transition-colors truncate',
                String(o.id) === String(value) && 'bg-rs-text-primary/5 font-semibold text-rs-text-primary',
                idx === highlighted && String(o.id) !== String(value) && 'bg-stone-100',
                idx === highlighted && String(o.id) === String(value) && 'bg-rs-text-primary/10',
                idx !== highlighted && 'hover:bg-stone-50'
              )}
            >
              {o.label || o.name}
            </li>
          ))
        }
      </ul>
    </div>,
    document.body
  ) : null;

  if (variant === 'inline') {
    return (
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        className="relative flex items-center cursor-pointer outline-none focus:opacity-80"
        onClick={handleOpen}
        onKeyDown={!open ? handleTriggerKeyDown : undefined}
      >
        <span className={cn('flex-1 text-sm font-medium truncate', !selected && 'text-stone-400')}>
          {selected ? (selected.label || selected.name) : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        {dropdownPortal}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      className={cn(
        'relative border-b pb-1 transition-colors flex items-center gap-1 outline-none',
        open ? 'border-rs-text-primary' : 'border-stone-200',
        !open && !disabled && 'focus:border-rs-text-primary',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onKeyDown={!open ? handleTriggerKeyDown : undefined}
    >
      {open ? (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search…"
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
        />
      ) : (
        <div
          className="flex-1 text-sm font-medium cursor-pointer truncate select-none"
          onClick={handleOpen}
        >
          {selected
            ? <span>{selected.label || selected.name}</span>
            : <span className="text-stone-400">{placeholder}</span>
          }
        </div>
      )}
      <ChevronDown
        onClick={handleOpen}
        className={cn('w-4 h-4 text-stone-400 flex-shrink-0 cursor-pointer transition-transform duration-200', open && 'rotate-180')}
      />
      {dropdownPortal}
    </div>
  );
};

export default SelectSearch;
