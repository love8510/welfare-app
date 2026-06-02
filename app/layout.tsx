import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: '재가노인복지센터 통합관리시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={notoSansKR.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
