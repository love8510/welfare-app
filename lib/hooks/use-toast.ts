'use client'
import * as React from 'react'

type ToastVariant = 'default' | 'destructive'
interface ToastItem { id: string; title: string; variant?: ToastVariant }

type Action =
  | { type: 'ADD'; toast: ToastItem }
  | { type: 'REMOVE'; id: string }

const toastState: { toasts: ToastItem[]; listeners: Array<(s: ToastItem[]) => void> } = {
  toasts: [],
  listeners: [],
}

function dispatch(action: Action) {
  if (action.type === 'ADD') {
    toastState.toasts = [...toastState.toasts, action.toast]
    setTimeout(() => dispatch({ type: 'REMOVE', id: action.toast.id }), 3000)
  } else {
    toastState.toasts = toastState.toasts.filter((t) => t.id !== action.id)
  }
  toastState.listeners.forEach((l) => l(toastState.toasts))
}

export function toast(title: string, variant: ToastVariant = 'default') {
  dispatch({ type: 'ADD', toast: { id: Math.random().toString(36).slice(2), title, variant } })
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(toastState.toasts)
  React.useEffect(() => {
    toastState.listeners.push(setToasts)
    return () => { toastState.listeners = toastState.listeners.filter((l) => l !== setToasts) }
  }, [])
  return { toasts }
}
