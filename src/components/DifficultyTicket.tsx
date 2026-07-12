import React from 'react';

interface DifficultyTicketProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function DifficultyTicket({ title, description, isSelected, onClick }: DifficultyTicketProps) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      {/* Floating Checkmark */}
      <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 -translate-y-1' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-primary text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Perforated Ticket */}
      <div 
        className={`relative w-full h-16 bg-[var(--card-bg)] border-2 border-dashed flex items-center justify-center px-2
          ${isSelected ? 'border-primary' : 'border-[var(--card-border)]'}
          [mask-image:radial-gradient(circle_at_0%_50%,transparent_10px,black_10px),radial-gradient(circle_at_100%_50%,transparent_10px,black_10px)]
        `}
      >
        <span className="font-game-heading text-xs md:text-sm uppercase tracking-wider text-[var(--foreground)] text-center">
          {title}
        </span>
      </div>

      {/* Description */}
      <span className="font-game-mono text-xs text-[var(--foreground)] opacity-60 uppercase tracking-tight">
        {description}
      </span>
    </div>
  );
}
