import { cn } from '@/lib/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 focus:ring-blue-500',
      secondary: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-700 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white',
      ghost: 'text-gray-400 hover:bg-white/5 hover:text-white',
      glass:
        'glass-button bg-white/5 text-white backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20',
      white: 'bg-white text-black shadow-lg shadow-white/5 hover:bg-gray-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-8 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
