import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SchemaForge — AI AWS Database Schema Designer',
  description:
    'Describe your application. Get an optimized Aurora PostgreSQL, Aurora DSQL, or DynamoDB schema — with ER diagram and CloudFormation template — in seconds.',
  keywords: ['AWS', 'Aurora', 'DynamoDB', 'database schema', 'AI', 'CloudFormation', 'schema design'],
  openGraph: {
    title: 'SchemaForge',
    description: 'From idea to AWS database schema in seconds',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
