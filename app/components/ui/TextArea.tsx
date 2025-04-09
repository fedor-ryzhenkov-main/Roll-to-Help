'use client';

import React from 'react';
import { FieldError, UseFormRegister, FieldValues } from 'react-hook-form';
import { cn } from '@/app/utils/cn';

export interface TextAreaProps<TFieldValues extends FieldValues> 
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label?: string;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  helpText?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
  rows?: number;
}

/**
 * Reusable textarea component with error handling
 */
const TextAreaComponent: React.ForwardRefRenderFunction<
  HTMLTextAreaElement, 
  TextAreaProps<FieldValues>
> = (
  {
    id,
    label,
    register,
    error,
    helpText,
    wrapperClassName,
    labelClassName,
    textareaClassName,
    errorClassName,
    rows = 4,
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
      
      <textarea
        id={id}
        rows={rows}
        {...register(id)}
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-vertical',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-purple-500',
          textareaClassName
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

export const TextArea = React.forwardRef(TextAreaComponent);
TextArea.displayName = 'TextArea'; 