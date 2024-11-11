'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as web3 from '@solana/web3.js'
import * as token from '@solana/spl-token'
import { useWallet } from './WalletContext'


// Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

interface TokenData {
  id: string
  balance: number
  decimals: number
  supply: string
  created: string
  name: string
  symbol: string
  uri: string
}

interface TokenContextType {
  tokens: TokenData[]
  loading: boolean
  refreshTokens: () => Promise<void>
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

export function TokenProvider({ children }: { children: ReactNode }) {
  const { publicKey, wallet } = useWallet()
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(false)

const fetchMetadataFromExplorer = async (mintAddress: string) => {
  try {
    const connection = new web3.Connection('https://api.devnet.solana.com');
    const [metadataPDA] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new web3.PublicKey(mintAddress).toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    
    if (metadataAccount) {
      const data = metadataAccount.data;
      
      // Raw 데이터 변환
      const rawData = Array.from(data);
      const rawHexData = Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      const rawUtf8Data = new TextDecoder().decode(data);

      // 메타데이터 구조 분석
      let name = 'Unknown';
      let symbol = 'UNKNOWN';
      let uri = '';

      // 1. 먼저 연속된 문자열 청크들을 모두 찾음
      const textChunks: { start: number; text: string }[] = [];
      let currentChunk = '';
      let chunkStart = -1;

      for (let i = 0; i < rawData.length; i++) {
        const byte = rawData[i];
        // 출력 가능한 ASCII 문자 범위 (32-126)
        if (byte >= 32 && byte <= 126) {
          if (chunkStart === -1) chunkStart = i;
          currentChunk += String.fromCharCode(byte);
        } else {
          if (currentChunk.length >= 3) { // 최소 3글자 이상인 경우만 저장
            textChunks.push({ start: chunkStart, text: currentChunk });
          }
          currentChunk = '';
          chunkStart = -1;
        }
      }

      // 마지막 청크 처리
      if (currentChunk.length >= 3) {
        textChunks.push({ start: chunkStart, text: currentChunk });
      }

      // 2. 청크들을 분석하여 name, symbol, uri 식별
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i].text;
        
        // URI 패턴 매칭 (http:// 또는 https:// 로 시작하는 경우)
        if (chunk.match(/^https?:\/\//)) {
          uri = chunk;
          continue;
        }

        // 이름 후보 식별 (알파벳과 공백만 허용)
        if (name === 'Unknown' && 
            chunk.match(/^[a-zA-Z\s]+$/) && // 알파벳과 공백만 허용
            chunk.length >= 3 && chunk.length <= 20 &&
            chunk.trim().length > 0) { // 공백으로만 이루어진 경우 제외
          name = chunk.trim(); // 앞뒤 공백 제거
          continue;
        }
        
        // 심볼 후보 식별 (대문자 알파벳만 허용)
        if (name !== 'Unknown' && symbol === 'UNKNOWN' && 
            chunk.match(/^[A-Z]+$/) &&
            chunk.length >= 2 && chunk.length <= 10) {
          symbol = chunk;
          continue;
        }
      }

      console.log('Enhanced metadata parsing for', mintAddress, ':', {
        name,
        symbol,
        uri,
        textChunks
      });

      return {
        name,
        symbol,
        uri,
        rawData,
        rawHexData,
        rawUtf8Data,
        debugInfo: {
          textChunks,
          fullData: rawData,
          foundName: name,
          foundSymbol: symbol
        }
      };
    }

    return {
      name: 'Unknown',
      symbol: 'UNKNOWN',
      uri: '',
      rawData: [],
      rawHexData: '',
      rawUtf8Data: ''
    };
  } catch (error) {
    console.error('메타데이터 조회 실패:', error);
    return {
      name: 'Unknown',
      symbol: 'UNKNOWN',
      uri: '',
      rawData: [],
      rawHexData: '',
      rawUtf8Data: ''
    };
  }
};


  const fetchTokenAccounts = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new web3.PublicKey(publicKey),
        {
          programId: token.TOKEN_PROGRAM_ID,
        }
      )

      const tokenData: TokenData[] = await Promise.all(
        tokenAccounts.value.map(async (account) => {
          const mintPubkey = new web3.PublicKey(account.account.data.parsed.info.mint)
          const mintInfo = await token.getMint(connection, mintPubkey)

          const metadata = await fetchMetadataFromExplorer(mintPubkey.toString())
          
          return {
            id: account.account.data.parsed.info.mint,
            balance: account.account.data.parsed.info.tokenAmount.uiAmount,
            decimals: mintInfo.decimals,
            supply: mintInfo.supply.toString(),
            created: new Date().toISOString().split('T')[0],
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri
          }
        })
      )

      console.log('Found tokens:', tokenData)
      setTokens(tokenData)
    } catch (error) {
      console.error('토큰 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 지갑이 연결되면 토큰 데이터 조회
  useEffect(() => {
    if (publicKey) {
      fetchTokenAccounts()
    }
  }, [publicKey])

  const value = {
    tokens,
    loading,
    refreshTokens: fetchTokenAccounts
  }

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  )
}

export function useTokens() {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error('useTokens must be used within a TokenProvider')
  }
  return context
}