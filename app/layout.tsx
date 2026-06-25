import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NorthBridge Digital - Receptionist Platform',
  description: 'Multi-tenant AI receptionist platform documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
