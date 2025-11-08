
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light';
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'dark', ...props }) => {
  const hoverEffect = props.onClick ? 'interactive-3d' : '';
  const baseClasses = `rounded-xl shadow-lg p-6 transition-all duration-300 ${hoverEffect}`;

  const variantClasses = {
    dark: 'bg-[#2D3748]/60 backdrop-blur-lg border border-slate-700/80 hover:border-slate-600/80 hover:shadow-cyan-500/5',
    light: 'bg-white/40 backdrop-blur-lg border border-white/30 hover:shadow-xl'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;