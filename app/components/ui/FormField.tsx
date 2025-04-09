'use client';

import React from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/app/utils/cn';

export interface FormFieldProps<TFieldValues extends FieldValues> 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: Path<TFieldValues>;
  label?: string;
  register: UseFormRegister<TFieldValues>;
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
export const FormField = <TFieldValues extends FieldValues>({
  id,
  label,
  register,
  error,
  helpText,
  type = 'text',
  wrapperClassName,
  labelClassName,
  inputClassName,
  errorClassName,
  disabled,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const baseInputClasses = 
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';
  const errorInputClasses = 
    'border-red-500 focus:border-red-500 focus:ring-red-500';
  const disabledInputClasses = 
    'bg-gray-100 cursor-not-allowed';

  return (
    <div className={cn('mb-4', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={cn('block text-sm font-medium text-gray-700', labelClassName)}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        disabled={disabled}
        {...register(id)}
        className={cn(
          baseInputClasses,
          error ? errorInputClasses : '',
          disabled ? disabledInputClasses : '',
          inputClassName
        )}
        {...rest}
      />
      {error && (
        <p className={cn('mt-1 text-sm text-red-600', errorClassName)}>
          {error.message}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField'; 