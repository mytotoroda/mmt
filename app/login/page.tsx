// app/login/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useWeb3Auth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/mmt'); // 또는 메인 페이지로 리디렉션
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
          Welcome to Solana DEX
        </h1>
        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
        >
          Login with Web3Auth
        </button>
      </div>
    </div>
  );
}