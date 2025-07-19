import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

const LoadingSpinner = React.forwardRef(({ className, size = 'default', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2
      ref={ref}
      className={cn('animate-spin', sizeClasses[size], className)}
      {...props}
    />
  );
});
LoadingSpinner.displayName = 'LoadingSpinner';

const LoadingButton = React.forwardRef(({ children, loading, disabled, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
});
LoadingButton.displayName = 'LoadingButton';

export { LoadingSpinner, LoadingButton };