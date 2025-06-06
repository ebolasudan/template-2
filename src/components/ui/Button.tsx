'use client';

import React, { forwardRef, memo, useMemo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { theme } from '@/styles/theme';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles = {
      primary: `
        bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
        focus:ring-blue-500 disabled:bg-blue-300
      `,
      secondary: `
        bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400
        focus:ring-gray-500 disabled:bg-gray-100
      `,
      outline: `
        border-2 border-gray-300 text-gray-700 hover:bg-gray-50
        active:bg-gray-100 focus:ring-gray-500 disabled:border-gray-200
        disabled:text-gray-400
      `,
      ghost: `
        text-gray-700 hover:bg-gray-100 active:bg-gray-200
        focus:ring-gray-500 disabled:text-gray-400
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700 active:bg-red-800
        focus:ring-red-500 disabled:bg-red-300
      `,
    };

    // Size styles
    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
      xl: 'px-6 py-3.5 text-xl',
    };

    // Icon spacing
    const iconSpacing = {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5',
      xl: 'gap-3',
    };

    // Memoize the computed styles to prevent recreation on every render
    const baseStyles = useMemo(() => `
      inline-flex items-center justify-center font-medium
      rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      ${fullWidth ? 'w-full' : ''}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${iconSpacing[size]}
    `, [variant, size, fullWidth]);
    
    // Memoize motion props to prevent recreation
    const motionProps = useMemo(() => ({
      whileHover: { scale: disabled || isLoading ? 1 : 1.02 },
      whileTap: { scale: disabled || isLoading ? 1 : 0.98 },
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 17,
      },
    }), [disabled, isLoading]);

    return (
      <motion.button
        ref={ref}
        className={`${baseStyles} ${className}`}
        disabled={disabled || isLoading}
        {...motionProps}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Memoize the Button component to prevent unnecessary re-renders when props haven't changed
const MemoizedButton = memo(Button);
MemoizedButton.displayName = 'Button';

export default MemoizedButton;