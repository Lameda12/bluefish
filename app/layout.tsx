import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'BlueFish — Marine Heatwave Early Warning',
  description: 'Real-time marine heatwave dashboard for Nova Scotia aquaculture',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-[#0a1628] text-[#f0f9ff]">
        {children}
      </body>
    </html>
  )
}
