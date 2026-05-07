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
  <thead className={cn('border-b-2 border-gray-100', className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b border-gray-100/50 transition-colors hover:bg-gray-50/50', className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('pb-4 pt-2 text-left align-middle font-bold text-[12px] text-gray-400 uppercase tracking-widest', className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('py-4 align-middle text-[15px]', className)} {...props} />
);
