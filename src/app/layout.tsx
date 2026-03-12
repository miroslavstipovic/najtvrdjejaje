import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import HeaderWrapper from '@/components/HeaderWrapper'
import DynamicFooter from '@/components/DynamicFooter'
import { getSiteSettings } from '@/lib/services/settingsService'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Najtvrđe Jaje - Portal za natjecanja',
  description: 'Portal za natjecanje u najtvrđem jajetu - Bergerov sustav, rang liste, rezultati, vijesti',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read favicon and AdSense settings with request memoization
  // Uses React cache() to deduplicate requests within the same render
  const { faviconHref, adsenseClientId } = await getSiteSettings()
  
  return (
    <html lang="hr" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href={faviconHref} />
        {/* Google AdSense Verification */}
        {adsenseClientId && (
          <meta name="google-adsense-account" content={adsenseClientId} />
        )}
        {/* Google AdSense Script */}
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-cream-50 to-cream-200">
          <HeaderWrapper />
          <main className="flex-1">
            {children}
          </main>
          <DynamicFooter />
        </div>
      </body>
    </html>
  )
}
