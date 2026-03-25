import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";

interface Option {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  noResultsText?: string;
}

const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  options,
  value = "",
  onChange,
  placeholder = "Search and select...",
  label,
  disabled = false,
  className = "",
  noResultsText = "No results found",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    const lower = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
    setFocusedIndex(-1);
    // Focus the input after opening
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setQuery("");
    setFocusedIndex(-1);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setFocusedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filtered[focusedIndex]) {
          selectOption(filtered[focusedIndex].value);
        } else if (!isOpen) {
          openDropdown();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger / Display */}
        <div
          onClick={openDropdown}
          className={`flex min-h-11 items-center rounded-lg border border-gray-300 shadow-theme-xs transition dark:border-gray-700 dark:bg-gray-900 ${
            isOpen
              ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
              : ""
          } ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
              : "cursor-pointer"
          }`}
        >
          {isOpen ? (
            // Search input when open
            <div className="flex flex-1 items-center">
              <svg
                className="ml-3 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-full w-full bg-transparent py-2.5 pl-2 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
          ) : (
            // Display selected value or placeholder when closed
            <div className="flex flex-1 items-center px-4 py-2.5" tabIndex={disabled ? -1 : 0} onKeyDown={handleKeyDown}>
              <span
                className={`text-sm ${
                  selectedOption
                    ? "text-gray-800 dark:text-white/90"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
          )}

          {/* Right side: clear button or chevron */}
          <div className="flex items-center pr-3">
            {value && !isOpen && (
              <button
                type="button"
                onClick={clearSelection}
                disabled={disabled}
                className="mr-1 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                aria-label="Clear selection"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <svg
              className={`h-5 w-5 text-gray-700 transition-transform dark:text-gray-400 ${
                isOpen ? "rotate-180" : ""
              }`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div
            ref={listRef}
            className="absolute left-0 z-40 mt-1 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            style={{ maxHeight: "240px" }}
            role="listbox"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {noResultsText}
              </div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <div
                    key={option.value}
                    onClick={() => selectOption(option.value)}
                    className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-sm transition-colors ${
                      isFocused
                        ? "bg-gray-100 dark:bg-gray-800"
                        : isSelected
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      className={`flex-1 ${
                        isSelected
                          ? "font-medium text-brand-600 dark:text-brand-400"
                          : "text-gray-800 dark:text-white/90"
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutocompleteSelect;
