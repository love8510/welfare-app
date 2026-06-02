'use client'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastClose } from './toast'
import { useToast } from '@/lib/hooks/use-toast'

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, variant }) => (
        <Toast key={id} variant={variant}>
          <ToastTitle>{title}</ToastTitle>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
