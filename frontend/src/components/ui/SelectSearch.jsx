import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const DROP_MAX_H = 220; // px — matches max-h-52 (13rem ≈ 208px, we use 220 as buffer)

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
  const [dropStyle,   setDropStyle]   = useState({});
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef  = useRef(null);
  const inputRef      = useRef(null);
  const portalRef     = useRef(null); // entire dropdown panel
  const listRef       = useRef(null); // <ul> only — for scroll detection
  const openRef       = useRef(open);
  openRef.current = open;

  const selected = options.find(o => String(o.id) === String(value));

  const filtered = (() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    const starts   = options.filter(o => (o.name || '').toLowerCase().startsWith(q));
    const contains = options.filter(o => !(o.name || '').toLowerCase().startsWith(q) && (o.name || '').toLowerCase().includes(q));
    return [...starts, ...contains];
  })();

  // Compute and apply dropdown position (flip up when near bottom of viewport)
  const calcPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < DROP_MAX_H && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 220);

    if (openUp) {
      setDropStyle({
        position: 'fixed',
        bottom:   window.innerHeight - rect.top + 4,
        left:     rect.left,
        width,
        zIndex:   9999,
      });
    } else {
      setDropStyle({
        position: 'fixed',
        top:      rect.bottom + 4,
        left:     rect.left,
        width,
        zIndex:   9999,
      });
    }
  }, []);

  const doClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHighlighted(-1);
  }, []);

  const doOpen = useCallback(() => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setQuery('');
    setHighlighted(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, calcPos]);

  // Toggle: click trigger while open → close
  const handleTriggerClick = useCallback((e) => {
    e.stopPropagation();
    if (open) doClose();
    else doOpen();
  }, [open, doOpen, doClose]);

  const handleSelect = useCallback((option) => {
    onChange(String(option.id));
    doClose();
    setTimeout(() => containerRef.current?.focus(), 0);
  }, [onChange, doClose]);

  // Reset highlight when filtered list changes
  useEffect(() => { setHighlighted(-1); }, [query]);

  // Scroll keyboard-highlighted item into view
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('li[data-opt]');
    if (items[highlighted]) items[highlighted].scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  // Close on click outside (both container and portal panel)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const inContainer = containerRef.current?.contains(e.target);
      const inPortal    = portalRef.current?.contains(e.target);
      if (!inContainer && !inPortal) doClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open, doClose]);

  // Close on page scroll outside the list; reposition on resize
  useEffect(() => {
    if (!open) return;
    const onScroll = (e) => {
      // Scrolling inside the dropdown list is fine — don't close
      if (listRef.current?.contains(e.target)) return;
      doClose();
    };
    const onResize = () => {
      if (openRef.current) calcPos();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, doClose, calcPos]);

  // Keyboard nav for the trigger button (when closed)
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      doOpen();
    }
  };

  // Keyboard nav inside the search input (when open)
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
        if (highlighted >= 0 && filtered[highlighted]) handleSelect(filtered[highlighted]);
        else if (filtered.length === 1) handleSelect(filtered[0]);
        break;
      case 'Escape':
        e.preventDefault();
        doClose();
        break;
      case 'Tab':
        doClose();
        break;
      default:
        break;
    }
  };

  // Shared dropdown portal
  const dropdownPortal = open ? createPortal(
    <div
      ref={portalRef}
      style={dropStyle}
      className="bg-white border border-stone-200 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Search box inside the portal dropdown */}
      <div className="px-3 py-2 border-b border-stone-100 bg-stone-50/80">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search…"
          className="w-full text-xs bg-transparent outline-none font-medium placeholder:text-stone-400"
          data-no-upper
        />
      </div>
      <ul
        ref={listRef}
        className="max-h-52 overflow-y-auto overscroll-contain"
        role="listbox"
        style={{ overscrollBehavior: 'contain' }}
      >
        {filtered.length === 0
          ? <li className="px-4 py-3 text-xs text-stone-400 italic">No results</li>
          : filtered.map((o, idx) => {
              const isSelected = String(o.id) === String(value);
              const isHl       = idx === highlighted;
              return (
                <li
                  key={o.id}
                  data-opt
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlighted(idx)}
                  onMouseDown={() => handleSelect(o)}
                  className={cn(
                    'px-4 py-2.5 text-sm cursor-pointer transition-colors truncate select-none',
                    isSelected && !isHl && 'bg-rs-text-primary/5 font-semibold text-rs-text-primary',
                    isSelected &&  isHl && 'bg-rs-text-primary/10 font-semibold text-rs-text-primary',
                    !isSelected && isHl && 'bg-stone-100 text-stone-800',
                    !isSelected && !isHl && 'hover:bg-stone-50 text-stone-700',
                  )}
                >
                  {o.label || o.name}
                </li>
              );
            })
        }
      </ul>
    </div>,
    document.body
  ) : null;

  // ── Inline variant (used inside table cells) ──────────────────────────────
  if (variant === 'inline') {
    return (
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        className="relative flex items-center cursor-pointer outline-none focus:opacity-80 select-none"
        onClick={handleTriggerClick}
        onKeyDown={!open ? handleTriggerKeyDown : undefined}
      >
        <span className={cn('flex-1 text-sm font-medium truncate', !selected && 'text-stone-400')}>
          {selected ? (selected.label || selected.name) : placeholder}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200',
          open && 'rotate-180'
        )} />
        {dropdownPortal}
      </div>
    );
  }

  // ── Underline variant (default — used in form fields) ─────────────────────
  return (
    <div
      ref={containerRef}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      className={cn(
        'relative border-b pb-1 transition-colors flex items-center gap-1 outline-none',
        open ? 'border-rs-text-primary' : 'border-stone-200',
        !open && !disabled && 'focus:border-rs-text-primary hover:border-stone-400',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onKeyDown={!open ? handleTriggerKeyDown : undefined}
      onClick={handleTriggerClick}
    >
      <div className="flex-1 text-sm font-medium cursor-pointer truncate select-none min-h-[1.25rem]">
        {selected
          ? <span>{selected.label || selected.name}</span>
          : <span className="text-stone-400">{placeholder}</span>
        }
      </div>
      <ChevronDown
        className={cn(
          'w-4 h-4 text-stone-400 flex-shrink-0 cursor-pointer transition-transform duration-200 flex-shrink-0',
          open && 'rotate-180'
        )}
      />
      {dropdownPortal}
    </div>
  );
};

export default SelectSearch;
