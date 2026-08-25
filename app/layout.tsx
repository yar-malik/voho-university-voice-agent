import type { Metadata } from 'next'
import './globals.css'
import { university } from '@/config/university'

export const metadata: Metadata = {
  title: `${university.shortName} AI Voice Assistant`,
  description: 'AI-powered student support, admissions and university services — powered by Voho.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
