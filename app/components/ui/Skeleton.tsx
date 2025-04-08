'use client';

import React from 'react';
import { cn } from '@/app/utils/cn';

/**
 * Skeleton component for loading states
 * @param className - Optional className to be applied to the skeleton
 * @param props - Any additional props to be applied to the skeleton
 * @returns Skeleton component
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * Preset for text skeleton
 */
const TextSkeleton = ({ lines = 1, className, ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

/**
 * Preset for avatar skeleton
 */
const AvatarSkeleton = ({ size = 'md', className, ...props }: { size?: 'sm' | 'md' | 'lg' } & React.HTMLAttributes<HTMLDivElement>) => {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeMap[size], className)}
      {...props}
    />
  );
};

/**
 * Preset for card skeleton
 */
const CardSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn('space-y-4 rounded-lg border border-gray-200 p-4', className)}
    {...props}
  >
    <div className="flex items-center space-x-4">
      <AvatarSkeleton />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
    <TextSkeleton lines={3} />
  </div>
);

export { Skeleton, TextSkeleton, AvatarSkeleton, CardSkeleton }; 