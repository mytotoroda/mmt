'use client';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useWeb3Auth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-gray-100" />
          <p className="mt-4 text-center text-gray-600 dark:text-gray-300">페이지 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">로그인이 필요합니다. 상단의 네비게이션 바를 사용해 로그인하세요.</p>
      </div>
    );
  }

  return <>{children}</>;
}
