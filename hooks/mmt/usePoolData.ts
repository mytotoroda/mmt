// hooks/mmt/usePoolData.ts
import { useState, useEffect, useCallback } from 'react';
import { Pool } from '@/types/mmt/pool';
import { useWallet } from '@/contexts/WalletContext';

export function usePoolData() {
  const [pools, setPools] = useState<Pool[]>([]);
  const { network, connection } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch('/api/mmt/pools');
      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }
      
      const { success, pools: fetchedPools } = await response.json();
      if (!success || !Array.isArray(fetchedPools)) {
        throw new Error('Invalid response format');
      }

      setPools(fetchedPools);
      
    } catch (error) {
      console.error('Failed to fetch pools:', error);
      setError('풀 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [network, connection]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { 
    pools, 
    loading, 
    error, 
    setError, 
    fetchPools 
  };
}