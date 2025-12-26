import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost';
};

export function Button({ variant = 'default', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<string, string> = {
    default: 'bg-white border border-blue-100 text-blue-800 px-3 py-1.5',
    primary: 'bg-blue-600 text-white px-3 py-1.5 shadow-sm hover:bg-blue-700',
    ghost: 'bg-transparent text-blue-700 px-2 py-1'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
