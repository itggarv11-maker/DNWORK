
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'glass';
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'glass', ...props }) => {
  const hoverEffect = props.onClick ? 'interactive-3d cursor-pointer group' : '';
  
  // Base classes for the container
  const baseClasses = `rounded-2xl backdrop-blur-xl transition-all duration-300 ${hoverEffect}`;

  // Variant styles
  const variantClasses = {
    // The new default "God Level" Glass
    glass: 'bg-slate-900/60 border border-slate-700/50 shadow-xl text-slate-200',
    // A deeper, darker card for contrast
    dark: 'bg-slate-950/80 border border-slate-800 shadow-2xl text-slate-200',
    // Previously "light", now a lighter glass for specific highlights, but still dark-themed compatible
    light: 'bg-slate-800/40 border border-slate-700/50 shadow-lg text-slate-200 hover:bg-slate-800/60' 
  };

  // If the user passed 'bg-white' or text colors in className, they might clash. 
  // Ideally, we should strip them, but for now, the variant classes act as a strong base.
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
