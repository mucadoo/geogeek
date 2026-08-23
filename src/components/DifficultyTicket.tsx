import React from 'react';

interface DifficultyTicketProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

// Description text intentionally lives outside the ticket (QuizLayout shows
// it once, for the selected difficulty only) - repeating it under all 7
// tickets at once was the main source of clutter on the start screen.
export default function DifficultyTicket({ title, isSelected, onClick }: DifficultyTicketProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className="flex flex-col items-center gap-1.5 group"
    >
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
        className={`relative w-full h-14 bg-[var(--card-bg)] border-2 border-dashed flex items-center justify-center px-2 transition-colors
          ${isSelected ? 'border-primary' : 'border-[var(--card-border)] group-hover:border-primary/50'}
          [mask-image:radial-gradient(circle_at_0%_50%,transparent_10px,black_10px),radial-gradient(circle_at_100%_50%,transparent_10px,black_10px)]
        `}
      >
        <span className="font-game-heading text-xs md:text-sm uppercase tracking-wider text-[var(--foreground)] text-center">
          {title}
        </span>
      </div>
    </button>
  );
}
