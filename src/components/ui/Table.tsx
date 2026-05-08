import { clsx, type ClassValue } from 'clsx';
import React from 'react';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  // Removed hardcoded background so it inherits cleanly from its container page
  <div className="w-full overflow-hidden">
    <table className={cn('w-full caption-bottom text-sm border-collapse', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('border-b-2 border-[var(--card-border)]', className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b border-[var(--card-border)] transition-colors hover:bg-[var(--primary)]/5', className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('pb-4 pt-2 text-left align-middle font-game-heading text-xl text-slate-500 tracking-wider', className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('py-4 align-middle font-game-mono text-[var(--foreground)]', className)} {...props} />
);
