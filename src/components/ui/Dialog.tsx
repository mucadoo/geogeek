'use client';

import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Content */}
      <div 
        className={cn(
          "relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col",
          "bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-3xl shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-300",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--card-border)] p-6">
          <h2 className="font-bebas text-3xl tracking-wider text-[var(--color-primary)] dark:text-[#00a8b5]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 dark:bg-gray-800 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 font-game-mono text-sm leading-relaxed text-[var(--foreground)]">
          {children}
        </div>

        {/* Footer decoration */}
        <div className="h-4 bg-[var(--primary)]/10" />
      </div>
    </div>
  );
}
