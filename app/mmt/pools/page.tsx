'use client';
import { useState } from 'react';
import { 
  Box, 
  Container,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';  // Web3Auth import로 변경
import { Pool } from '@/types/mmt/pool';
import {
  PoolHeader,
  NetworkWarning,
  PoolList,
  PoolStats,
  NetworkStatus,
  ErrorAlert,
  NewPoolDialog,
  EditPoolDialog,
} from '@/components/mmt/pools';
import { usePoolData } from '@/hooks/mmt/usePoolData';
import { usePoolActions } from '@/hooks/mmt/usePoolActions';
import LoadingOverlay from '@/components/common/LoadingOverlay';

export default function MMTPools() {
  const theme = useTheme();
  // Web3Auth 관련 상태 가져오기
  const { 
    isAuthenticated,
    user: web3authUser,
    provider
  } = useWeb3Auth();

  const { pools, loading, error, setError, fetchPools } = usePoolData();
  const { togglePoolStatus, handleRefresh } = usePoolActions({ fetchPools, setError });
  
  const [isNewPoolOpen, setIsNewPoolOpen] = useState(false);
  const [editPool, setEditPool] = useState<Pool | null>(null);

  // network 정보 가져오기
  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet';

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        py: 4,
        bgcolor: 'background.default'
      }}
    >
      <Container maxWidth="xl">
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <PoolHeader 
            onRefresh={handleRefresh}
            onNewPool={() => setIsNewPoolOpen(true)}
            loading={loading}
            isWalletConnected={isAuthenticated && !!web3authUser?.wallet}
          />
          <NetworkWarning network={network} />
          {error && (
            <ErrorAlert 
              error={error} 
              onClose={() => setError(null)} 
            />
          )}
          {!loading && pools.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center',
                py: 8,
              }}
            >
              <Typography variant="h6" color="text.primary">
                등록된 AMM 풀이 없습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                새로운 AMM 풀을 생성하려면 "새 풀 생성" 버튼을 클릭하세요.
              </Typography>
            </Box>
          ) : (
            <>
              <PoolList 
                pools={pools}
                onToggleStatus={togglePoolStatus}
                onEdit={setEditPool}
                network={network}
              />
              <PoolStats pools={pools} />
            </>
          )}
        </Paper>
        <NetworkStatus network={network} />
        {isAuthenticated && web3authUser?.wallet && (
          <>
            <NewPoolDialog 
              open={isNewPoolOpen}
              onClose={() => setIsNewPoolOpen(false)}
              onSuccess={() => {
                fetchPools();
                setIsNewPoolOpen(false);
              }}
              walletPublicKey={web3authUser.wallet}
              connection={provider} // Web3Auth provider 사용
            />
            {editPool && (
              <EditPoolDialog
                open={!!editPool}
                pool={editPool}
                onClose={() => setEditPool(null)}
                onSuccess={() => {
                  fetchPools();
                  setEditPool(null);
                }}
                walletPublicKey={web3authUser.wallet}
                connection={provider} // Web3Auth provider 사용
              />
            )}
          </>
        )}
        {loading && <LoadingOverlay />}
      </Container>
    </Box>
  );
}