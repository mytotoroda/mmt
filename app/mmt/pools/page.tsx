// app/mmt/pools/page.tsx
'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { useWallet } from '@/contexts/WalletContext';
import { Pool } from '@/types/mmt/pool';

// 모든 컴포넌트를 한 번에 import
import {
  PoolHeader,
  NetworkWarning,
  LoadingContent,
  EmptyState,
  PoolTable,
  PoolStats,
  NetworkStatus,
  MobileActions,
  ErrorAlert,
  NewPoolDialog,
  EditPoolDialog,
  StatItem,
} from 'components/mmt/pools';

// 커스텀 훅 imports
import { usePoolData } from '@/hooks/mmt/usePoolData';
import { usePoolActions } from '@/hooks/mmt/usePoolActions';
import LoadingOverlay from '@/components/common/LoadingOverlay';

export default function MMTPools() {
  const { publicKey, network, connection } = useWallet();
  const { pools, loading, error, setError, fetchPools } = usePoolData();
  const { togglePoolStatus, handleRefresh } = usePoolActions({ fetchPools, setError });
  
  const [isNewPoolOpen, setIsNewPoolOpen] = useState(false);
  const [editPool, setEditPool] = useState<Pool | null>(null);

  // 로딩 상태
  if (loading && !pools.length) {
    return <LoadingContent />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PoolHeader 
        onRefresh={handleRefresh}
        onNewPool={() => setIsNewPoolOpen(true)}
        loading={loading}
        isWalletConnected={!!publicKey}
      />

      {/* Network Warning */}
      <NetworkWarning network={network} />
      
      {/* Error Alert */}
      {error && (
        <ErrorAlert 
          error={error} 
          onClose={() => setError(null)} 
        />
      )}

      {/* Main Content */}
      {!loading && pools.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <PoolTable 
            pools={pools}
            onToggleStatus={togglePoolStatus}
            onEdit={setEditPool}
            network={network}
          />
          <PoolStats pools={pools} />
        </>
      )}

      {/* Floating Elements */}
      <NetworkStatus network={network} />
      <MobileActions 
        onNewPool={() => setIsNewPoolOpen(true)} 
        disabled={!publicKey}
      />

      {/* Dialogs */}
      {publicKey && (
        <>
          <NewPoolDialog 
            open={isNewPoolOpen}
            onClose={() => setIsNewPoolOpen(false)}
            onSuccess={() => {
              fetchPools();
              setIsNewPoolOpen(false);
            }}
            walletPublicKey={publicKey}
            connection={connection}
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
              walletPublicKey={publicKey}
              connection={connection}
            />
          )}
        </>
      )}

      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}
    </Box>
  );
}