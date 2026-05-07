import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: ClassValue;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded bg-gray-200', className)
      )}
    />
  );
}
