'use client';

import React from 'react';
import { FieldError, UseFormRegister } from 'react-hook-form';
import { cn } from '@/app/utils/cn';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  helpText?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

/**
 * Reusable form field component with error handling
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      register,
      error,
      helpText,
      wrapperClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      className,
      ...props
    },
    ref
  ) => {
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
        
        <input
          id={id}
          {...register(id)}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-purple-500',
            inputClassName
          )}
          {...props}
          ref={ref}
        />
        
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

FormField.displayName = 'FormField';

export { FormField }; 