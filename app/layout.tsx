'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { WalletProvider } from '../contexts/WalletContext';
import { TokenProvider } from '../contexts/TokenContext';
import { AMMProvider } from '../contexts/AMMContext';
import { Web3AuthProvider } from '../contexts/Web3AuthContext';
import { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useAppTheme } from '@/hooks/useAppTheme';
import { MarketMakingProvider } from '../contexts/mmt/MarketMakingContext';
import { AuthGuard } from '@/components/AuthGuard';

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

const inter = Inter({ subsets: ['latin'] });

function ThemeWrapper({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Web3AuthProvider>
      <WalletProvider>
        <TokenProvider>
          <AMMProvider>
            <MarketMakingProvider>{children}</MarketMakingProvider>
          </AMMProvider>
        </TokenProvider>
      </WalletProvider>
    </Web3AuthProvider>
  );
}

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppProviders>
          <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemeWrapper>
              <div className="min-h-screen flex flex-col">
                {/* 항상 렌더링되는 Navbar */}
                <Navbar />
                <main className="flex-grow">
                  {/* AuthGuard로 보호된 children */}
                  <AuthGuard>{children}</AuthGuard>
                </main>
                <Footer />
              </div>
            </ThemeWrapper>
          </NextThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
