// app/mmt/layout.tsx
'use client';

import React from 'react';
import { Box } from '@mui/material';
import MMTNavigation from '@/components/mmt/MMTNavigation';

export default function MMTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <MMTNavigation />
      <Box sx={{ 
        p: { xs: 2, sm: 3 },
        maxWidth: 'xl',
        mx: 'auto'
      }}>
        {children}
      </Box>
    </Box>
  );
}