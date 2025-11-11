'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

// Simple toast context implementation
let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

export const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast: Toast = { id, message, type, duration }
  
  toasts = [...toasts, newToast]
  toastListeners.forEach(listener => listener(toasts))
  
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id)
      toastListeners.forEach(listener => listener(toasts))
    }, duration)
  }
}

export const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id)
  toastListeners.forEach(listener => listener(toasts))
}

export function ToastContainer() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts)
    }
    
    toastListeners.push(listener)
    setToastList(toasts)
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  if (toastList.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md w-full">
      {toastList.map((toast) => {
        const bgColor = {
          success: 'bg-gradient-to-r from-green-900 via-green-800 to-green-900',
          error: 'bg-gradient-to-r from-red-900 via-red-800 to-red-900',
          info: 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900',
          warning: 'bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-900'
        }[toast.type]

        const borderColor = {
          success: 'border-green-700/50',
          error: 'border-red-700/50',
          info: 'border-gray-700/50',
          warning: 'border-yellow-700/50'
        }[toast.type]

        const icon = {
          success: (
            <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          error: (
            <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          info: (
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          warning: (
            <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        }[toast.type]

        return (
          <div
            key={toast.id}
            className={`${bgColor} border ${borderColor} rounded-2xl p-4 shadow-2xl backdrop-blur-sm animate-slide-in-right flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Close toast"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Add CSS for animation in globals.css
const toastStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
`

export default ToastContainer

