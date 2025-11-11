'use client'

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'circle' | 'rectangular'
  width?: string
  height?: string
  className?: string
  count?: number
}

export function SkeletonLoader({ 
  variant = 'rectangular', 
  width, 
  height, 
  className = '',
  count = 1 
}: SkeletonLoaderProps) {
  const baseClasses = 'skeleton rounded-lg'
  
  const variantClasses = {
    text: 'h-4',
    card: 'h-48',
    circle: 'rounded-full',
    rectangular: 'h-24'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  if (count === 1) {
    return (
      <div 
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      />
    )
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
      <SkeletonLoader variant="rectangular" height="24px" width="60%" className="mb-4" />
      <SkeletonLoader variant="text" width="100%" className="mb-2" />
      <SkeletonLoader variant="text" width="80%" className="mb-4" />
      <SkeletonLoader variant="rectangular" height="120px" width="100%" />
    </div>
  )
}

export function SkeletonCourseCard() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-6 shadow-2xl">
      <SkeletonLoader variant="rectangular" height="200px" width="100%" className="mb-4 rounded-2xl" />
      <SkeletonLoader variant="rectangular" height="20px" width="40%" className="mb-3" />
      <SkeletonLoader variant="text" width="100%" className="mb-2" />
      <SkeletonLoader variant="text" width="90%" className="mb-2" />
      <SkeletonLoader variant="text" width="70%" className="mb-4" />
      <SkeletonLoader variant="rectangular" height="48px" width="100%" className="rounded-2xl" />
    </div>
  )
}

export default SkeletonLoader

