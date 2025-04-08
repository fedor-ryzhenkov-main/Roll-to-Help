'use client';

import React from 'react';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  message: string | null | undefined;
  errors?: string[] | Record<string, string>[];
  severity?: ErrorSeverity;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Reusable error message component for displaying API errors
 */
export default function ErrorMessage({
  message,
  errors,
  severity = 'error',
  className = '',
  onDismiss
}: ErrorMessageProps) {
  if (!message && (!errors || errors.length === 0)) {
    return null;
  }

  const severityStyles = {
    error: 'bg-red-50 border-red-300 text-red-700',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    info: 'bg-blue-50 border-blue-300 text-blue-700'
  };

  const severityIconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`p-3 rounded-md border ${severityStyles[severity]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {severity === 'error' && (
            <svg className={`h-5 w-5 ${severityIconStyles[severity]}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {severity === 'warning' && (
            <svg className={`h-5 w-5 ${severityIconStyles[severity]}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {severity === 'info' && (
            <svg className={`h-5 w-5 ${severityIconStyles[severity]}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          {message && <div className="text-sm font-medium">{message}</div>}
          
          {errors && errors.length > 0 && (
            <ul className="mt-2 pl-5 text-sm list-disc space-y-1">
              {errors.map((error, index) => {
                const errorMessage = typeof error === 'string' 
                  ? error 
                  : Object.entries(error)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ');
                      
                return <li key={index}>{errorMessage}</li>;
              })}
            </ul>
          )}
        </div>
        
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 