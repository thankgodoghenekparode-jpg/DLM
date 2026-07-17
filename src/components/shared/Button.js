export default function Button({ children, variant = "primary", size = "md", className = "", disabled, type = "button", onClick }) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border-2 border-primary text-primary hover:bg-primary-bg",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
