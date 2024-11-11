'use client'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useAuth } from '../contexts/AuthContext'
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js'

// 타입 정의
interface User {
 username: string;
}

interface AuthContextType {
 user: User | null;
 logout: () => void;
}

interface WalletContextType {
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  network: 'mainnet-beta' | 'devnet';
  connection: Connection; // 추가
}

interface ThemeContextType {
 theme: string | undefined;
 setTheme: (theme: string) => void;
}

const Navbar: React.FC = () => {
 const { user, logout } = useAuth() as AuthContextType
 const { theme, setTheme } = useTheme() as ThemeContextType
 const [mounted, setMounted] = useState<boolean>(false)
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
 const { publicKey, connectWallet, disconnectWallet, network } = useWallet() as WalletContextType
 const [balance, setBalance] = useState<number>(0)

 // SOL 잔액을 가져오는 함수

const getBalance = async (publicKeyStr: string, network: 'mainnet-beta' | 'devnet') => {
  try {
    // GenesysGo나 Quicknode 같은 RPC 제공자의 엔드포인트 사용
    const endpoint = network === 'mainnet-beta'
      ? 'https://solana-mainnet.g.alchemy.com/v2/ttHUTjU3xC1roX4v2sPpqtGGFOk2uUVl5r'  // 무료 RPC
      // 또는 다음 중 하나 사용:
      // 'https://solana-mainnet.rpc.extrnode.com'
      // 'https://solana-api.projectserum.com'
      : 'https://api.devnet.solana.com';
    
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: undefined
    });
    
    const balance = await connection.getBalance(new PublicKey(publicKeyStr));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

 // 잔액 업데이트를 위한 useEffect
useEffect(() => {
  if (publicKey && network) {
    const updateBalance = async () => {
      const sol = await getBalance(publicKey, network);
      setBalance(sol);
    };
    
    updateBalance();
    
    // 10초마다 잔액 업데이트
    const interval = setInterval(() => updateBalance(), 10000);
    return () => clearInterval(interval);
  }
}, [publicKey, network]); // network 의존성 추가

 // hydration 처리
 useEffect(() => {
   setMounted(true)
 }, [])

 if (!mounted) {
   return null
 }

 return (
   <nav className="border-b border-gray-200 dark:border-gray-700">
     <div className="container mx-auto px-4">
       <div className="flex items-center justify-between h-16">
         {/* 왼쪽 섹션 - 로고와 데스크톱 메뉴 */}
         <div className="flex items-center">
           <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-white">
             Solana App
           </Link>
           
           {/* 데스크톱 메뉴 */}
           <div className="hidden md:block ml-10">
             <div className="flex items-center space-x-4">
               <Link 
                 href="/meme-coins" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
               >
                 토큰생성
               </Link>
               <Link 
                 href="/tokens" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
               >
                 토큰관리
               </Link>
               <Link 
                 href="/lp" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
               >
                 유동성공급
               </Link>
               <Link 
                 href="/make-wallet" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
               >
                 지갑주소생성
               </Link>
               <Link 
                 href="/airdrops" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
               >
                 에어드랍관리
               </Link>
               <Link 
                 href="/contract" 
                 className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
               >
                 컨트렉트등록
               </Link>
             </div>
           </div>
         </div>

         {/* 오른쪽 섹션 - 유저 정보, 지갑, 테마 토글 */}
         <div className="flex items-center space-x-4">
           {/* 유저 정보 */}
           <div className="hidden md:flex items-center space-x-4">
             {user ? (
               <>
                 <span className="text-gray-600 dark:text-gray-300">
                   {user.username}
                 </span>
                 <button
                   onClick={logout}
                   className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                 >
                   로그아웃
                 </button>
               </>
             ) : (
               <Link
                 href="/login"
                 className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
               >
                 로그인
               </Link>
             )}
           </div>

           {/* 지갑 연결 - 데스크톱 */}
           <div className="hidden md:flex items-center space-x-4">
             {/* 네트워크 표시 */}
             <div className={`px-2 py-1 text-xs rounded-full ${
               network === 'mainnet-beta' 
                 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                 : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
             }`}>
               {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
             </div>

             {publicKey ? (
               <div className="flex items-center space-x-2">
                 <div className="flex flex-col items-end">
                   <span className="text-sm text-gray-600 dark:text-gray-400">
                     {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
                   </span>
                   <span className="text-xs text-gray-500 dark:text-gray-400">
                     {balance.toFixed(4)} SOL
                   </span>
                 </div>
                 <button
                   onClick={disconnectWallet}
                   className="flex items-center px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                 >
                   <Wallet className="h-4 w-4 mr-1" />
                   연결해제
                 </button>
               </div>
             ) : (
               <button
                 onClick={connectWallet}
                 className="flex items-center px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors"
               >
                 <Wallet className="h-4 w-4 mr-1" />
                 지갑연결
               </button>
             )}
           </div>

           {/* 테마 토글 버튼 */}
           <button
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
             aria-label="Toggle dark mode"
           >
             {theme === 'dark' ? (
               <Sun className="h-5 w-5 text-gray-800 dark:text-gray-200" />
             ) : (
               <Moon className="h-5 w-5 text-gray-800 dark:text-gray-200" />
             )}
           </button>

           {/* 모바일 지갑 연결 버튼 */}
           <div className="md:hidden flex items-center space-x-2">
             {/* 네트워크 표시 - 모바일 */}
             <div className={`px-2 py-1 text-xs rounded-full ${
               network === 'mainnet-beta' 
                 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                 : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
             }`}>
               {network === 'mainnet-beta' ? 'M' : 'D'}
             </div>

             {publicKey ? (
               <div className="flex items-center space-x-2">
                 <div className="flex flex-col items-end">
                   <span className="text-sm text-gray-600 dark:text-gray-400">
                     {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
                   </span>
                   <span className="text-xs text-gray-500 dark:text-gray-400">
                     {balance.toFixed(4)} SOL
                   </span>
                 </div>
                 <button
                   onClick={disconnectWallet}
                   className="flex items-center px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                 >
                   <Wallet className="h-4 w-4" />
                 </button>
               </div>
             ) : (
               <button
                 onClick={connectWallet}
                 className="flex items-center px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors"
               >
                 <Wallet className="h-4 w-4" />
               </button>
             )}
           </div>

           {/* 모바일 메뉴 토글 버튼 */}
           <button
             type="button"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
             aria-label="Toggle mobile menu"
           >
             <svg
               className="h-6 w-6"
               stroke="currentColor"
               fill="none"
               viewBox="0 0 24 24"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth="2"
                 d="M4 6h16M4 12h16M4 18h16"
               />
             </svg>
           </button>
         </div>
       </div>

       {/* 모바일 메뉴 */}
       {isMobileMenuOpen && (
         <div className="md:hidden py-2">
           <div className="space-y-1 pb-3 border-b border-gray-200 dark:border-gray-700">
             <Link
               href="/meme-coins"
               className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
             >
               밈코인관리
             </Link>
             <Link
               href="/airdrops"
               className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
             >
               에어드랍관리
             </Link>
             <Link
               href="/users"
               className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
             >
               유저관리
             </Link>
           </div>
           
           {/* 모바일 유저 정보 */}
           <div className="pt-4 pb-3">
             {user ? (
               <div className="flex items-center justify-between px-3">
                 <span className="text-gray-600 dark:text-gray-300">
                   {user.username}
                 </span>
                 <button
                   onClick={logout}
                   className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                 >
                   로그아웃
                 </button>
               </div>
             ) : (
               <div className="px-3">
                 <Link
                   href="/login"
                   className="block text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                 >
                   로그인
                 </Link>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   </nav>
 )
}

export default Navbar