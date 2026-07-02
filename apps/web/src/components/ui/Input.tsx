import React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-dark-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            leftIcon && 'ps-10',
            rightIcon && 'pe-10',
            error && 'border-red-400 focus:ring-red-400 dark:border-red-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-dark-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-dark-400">{hint}</p>}
    </div>
  );
});
