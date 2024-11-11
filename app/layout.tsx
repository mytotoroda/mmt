//ts
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ThemeProvider } from 'next-themes'
import { WalletProvider } from '../contexts/WalletContext'
import { AuthProvider } from '../contexts/AuthContext'
import { TokenProvider } from '../contexts/TokenContext'
import { ReactNode } from 'react'

// 전역 window 타입 확장
declare global {
  interface Window {
    global: Window;
    Buffer: typeof Buffer;
    process: NodeJS.Process;
  }
}

// window 객체 설정
if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = window.Buffer || require('buffer').Buffer;
  window.process = window.process || require('process');
}

const inter = Inter({ subsets: ['latin'] })

// 메타데이터 타입 지정
export const metadata: Metadata = {
  title: 'Solana Meme Coin Manager',
  description: 'Manage your Solana meme coins and airdrops',
  keywords: 'solana, meme coin, crypto, blockchain, airdrop',
}


// Props 타입 정의
interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <WalletProvider>
          <TokenProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* 네비게이션 바 */}
                <Navbar />
                
                {/* 메인 컨텐츠 영역 */}
                <main className="flex-grow">
                  {children}
                </main>
                
                {/* 푸터 */}
                <Footer />
              </div>
            </ThemeProvider>
          </TokenProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}