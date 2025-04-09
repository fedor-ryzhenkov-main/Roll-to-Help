'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FieldError, UseFormRegister, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/app/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<TFieldValues extends FieldValues> 
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  id: Path<TFieldValues>;
  label?: string;
  options: SelectOption[];
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  helpText?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Select component with form integration
 * Use React.ForwardRefRenderFunction for typing inner component
 */
const SelectComponent: React.ForwardRefRenderFunction<
  HTMLSelectElement, // Type of the element being forwarded
  SelectProps<FieldValues> // Use FieldValues as default generic here
> = (
  {
    id,
    label,
    options,
    register, // register type is now UseFormRegister<FieldValues>
    error,
    helpText,
    wrapperClassName,
    labelClassName,
    selectClassName,
    errorClassName,
    size = 'md',
    className,
    ...props
  },
  ref
) => {
  // Size classes
  const sizeClasses = {
    sm: 'py-1 text-sm',
    md: 'py-2',
    lg: 'py-3 text-lg',
  };

  return (
    <div className={cn('mb-4', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <select
        id={id}
        {...register(id)}
        className={cn(
          'w-full px-3 border rounded-md focus:outline-none focus:ring-2 appearance-none bg-white',
          sizeClasses[size],
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-purple-500',
          selectClassName,
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select dropdown arrow */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="h-4 w-4 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className={cn('text-red-500 text-sm mt-1', errorClassName)}>
          {error.message}
        </p>
      )}

      {helpText && !error && (
        <p className="text-gray-500 text-sm mt-1">{helpText}</p>
      )}
    </div>
  );
};

// Export using forwardRef and set displayName
export const Select = React.forwardRef(SelectComponent);
// NOTE: This makes the exported Select component typed with FieldValues,
// but usage should still work with more specific types due to hook form inference.
Select.displayName = 'Select';

/**
 * SearchableSelect component with search functionality
 */
export const SearchableSelect = React.forwardRef<HTMLDivElement, Omit<SelectProps<FieldValues>, 'register' | 'id'> & {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
}>(
  (
    {
      id,
      label,
      options,
      error,
      helpText,
      wrapperClassName,
      labelClassName,
      selectClassName,
      errorClassName,
      size = 'md',
      value,
      onChange,
      className,
    },
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedOption = options.find(option => option.value === value) || null;
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Size classes
    const sizeClasses = {
      sm: 'py-1 text-sm',
      md: 'py-2',
      lg: 'py-3 text-lg',
    };

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Handle option selection
    const handleSelect = (option: SelectOption) => {
      setIsOpen(false);
      setSearchTerm('');
      onChange?.(option.value);
    };

    return (
      <div className={cn('mb-4 relative', wrapperClassName)} ref={dropdownRef}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Searchable input */}
        <div
          className={cn(
            'w-full px-3 border rounded-md focus-within:outline-none focus-within:ring-2 cursor-pointer bg-white flex items-center justify-between',
            sizeClasses[size],
            error
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-gray-300 focus-within:ring-purple-500',
            selectClassName,
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex-1">
            {isOpen ? (
              <input
                type="text"
                className="w-full border-none p-0 focus:outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span>{selectedOption?.label || 'Select an option'}</span>
            )}
          </div>
          <div className="ml-2">
            <svg
              className={cn('h-4 w-4 transform transition-transform', isOpen && 'rotate-180')}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'px-3 py-2 cursor-pointer hover:bg-gray-100',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    selectedOption?.value === option.value && 'bg-purple-50 text-purple-700'
                  )}
                  onClick={() => !option.disabled && handleSelect(option)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No options found</div>
            )}
          </div>
        )}

        {error && (
          <p className={cn('text-red-500 text-sm mt-1', errorClassName)}>
            {error.message}
          </p>
        )}

        {helpText && !error && (
          <p className="text-gray-500 text-sm mt-1">{helpText}</p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect'; 