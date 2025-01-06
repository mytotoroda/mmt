// app/manage-wallet/layout.tsx
'use client';

import React from 'react';
import { Box } from '@mui/material';
import { MMTProvider } from '@/contexts/mmt/MMTContext';
import WalletNavigation from '@/components/manage-wallet/WalletNavigation';

interface WalletLayoutProps {
  children: React.ReactNode;
}

export default function WalletLayout({ children }: WalletLayoutProps) {
  return (
    <MMTProvider>
      <Box sx={{ minHeight: '100vh' }}>
        <WalletNavigation />
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          maxWidth: 'xl',
          mx: 'auto'
        }}>
          {children}
        </Box>
      </Box>
    </MMTProvider>
  );
}