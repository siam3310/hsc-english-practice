import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 font-mono text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 border border-white",
    outline: "bg-transparent text-white border border-white hover:bg-white hover:text-black",
    ghost: "bg-transparent text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full block"></span>
          PROCESSING...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;