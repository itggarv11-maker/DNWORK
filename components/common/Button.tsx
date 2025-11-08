
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'interactive-3d rounded-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-400 shadow-lg hover:shadow-violet-500/30',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus-visible:ring-slate-500 shadow-md',
    outline: 'bg-transparent border-2 border-violet-500 text-violet-400 font-bold hover:bg-violet-500/20 focus-visible:ring-violet-400',
    ghost: 'bg-transparent text-gray-400 hover:bg-slate-700/50 hover:text-violet-400 focus-visible:ring-violet-400'
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;