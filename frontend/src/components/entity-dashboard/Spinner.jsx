/** Reusable loading spinner for dashboard components. */
export default function Spinner({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 border-2' : size === 'lg' ? 'h-12 w-12 border-2' : 'h-8 w-8 border-2';
  return (
    <div
      className={`animate-spin rounded-full border-slate-300 border-t-blue-500 ${sizeClass} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
