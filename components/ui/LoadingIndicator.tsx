import React from 'react';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string; // Tailwind color class for spinner
};

export default function LoadingIndicator({ size = 'md', colorClass = 'border-blue-500' }: Props) {
  const sizes: Record<string, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-4',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <div className={`animate-spin rounded-full border-t-transparent ${colorClass} ${sizes[size]}`} />
    </div>
  );
}
