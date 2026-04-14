'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { ChevronDown, Check, Search } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  searchable = false,
  className,
  disabled = false,
  error,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const [mounted, setMounted] = React.useState(false);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // SSR mount guard
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q),
    );
  }, [options, search]);

  // Position dropdown using portal
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  // Open handler
  const handleOpen = React.useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearch('');
    setHighlightedIndex(-1);
    updatePosition();
  }, [disabled, updatePosition]);

  // Close handler
  const handleClose = React.useCallback(() => {
    setOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Select an option
  const handleSelect = React.useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      onChange(option.value);
      handleClose();
    },
    [onChange, handleClose],
  );

  // Reposition on scroll / resize
  React.useEffect(() => {
    if (!open) return;
    const reposition = () => updatePosition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, updatePosition]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (open && searchable) {
      const timer = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [open, searchable]);

  // Click outside to close
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      handleClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, handleClose]);

  // Escape to close
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next]?.disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        const firstEnabled = filteredOptions.findIndex((o) => !o.disabled);
        setHighlightedIndex(firstEnabled);
        break;
      }
      case 'End': {
        e.preventDefault();
        let last = filteredOptions.length - 1;
        while (last >= 0 && filteredOptions[last]?.disabled) last--;
        setHighlightedIndex(last);
        break;
      }
    }
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const selectId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="font-body text-sm font-semibold text-ink-2"
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => (open ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between w-full h-9 px-3',
          'rounded-md bg-surface-2 border border-border-2',
          'font-body text-sm text-ink text-left',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
          'disabled:pointer-events-none disabled:opacity-50',
          error && 'border-red focus:ring-red',
          open && 'ring-2 ring-violet border-violet',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-ink-3')}>
          {selectedOption ? (
            <span className="inline-flex items-center gap-2">
              {selectedOption.icon && (
                <span className="flex-shrink-0 w-4 h-4">{selectedOption.icon}</span>
              )}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-ink-3 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Error */}
      {error && (
        <p className="font-body text-xs text-red font-medium">{error}</p>
      )}

      {/* Dropdown (portal) */}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            onKeyDown={handleKeyDown}
            className={cn(
              'rounded-lg border border-border bg-white shadow-lg',
              'animate-scale-in origin-top',
              'flex flex-col',
            )}
          >
            {/* Search input */}
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder="Search..."
                  className={cn(
                    'w-full bg-transparent font-body text-sm text-ink',
                    'placeholder:text-ink-3',
                    'outline-none',
                  )}
                  aria-label="Search options"
                />
              </div>
            )}

            {/* Options list */}
            <div
              ref={listRef}
              role="listbox"
              className="max-h-60 overflow-y-auto p-1"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center font-body text-sm text-ink-3">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected = option.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={option.value}
                      data-option
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer',
                        'font-body text-sm transition-colors duration-100',
                        option.disabled
                          ? 'opacity-40 pointer-events-none'
                          : isHighlighted
                            ? 'bg-violet/5'
                            : 'hover:bg-violet/5',
                        isSelected && 'text-violet font-medium',
                        !isSelected && 'text-ink',
                      )}
                    >
                      {/* Option icon */}
                      {option.icon && (
                        <span className="flex-shrink-0 w-4 h-4">{option.icon}</span>
                      )}

                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div className="truncate text-xs text-ink-3 mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>

                      {/* Check indicator */}
                      {isSelected && (
                        <Check className="w-4 h-4 text-violet flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
