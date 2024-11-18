// components/amm/AMMNavigation.tsx
'use client';

import React from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Container,
  useTheme,
  alpha
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme as useNextTheme } from 'next-themes';

const allTabs = [
  { label: '토큰 스왑', path: '/amm' },
  { label: '유동성 풀', path: '/amm/pools' },
  { label: '토큰 관리', path: '/amm/admin/tokens' },
  { label: '풀 관리', path: '/amm/admin/pools' },
  { label: '트랜잭션', path: '/amm/admin/transactions' },
];

export default function AMMNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useTheme();
  const { resolvedTheme } = useNextTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const getActiveTab = () => {
    return allTabs.findIndex(tab => {
      if (tab.path === '/amm' && pathname === '/amm') {
        return true;
      }
      return pathname.startsWith(tab.path);
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: isDarkMode ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Container maxWidth="lg">
        <Tabs 
          value={getActiveTab()} 
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': {
              backgroundColor: isDarkMode 
                ? 'rgb(96, 165, 250)' // blue-400
                : 'rgb(59, 130, 246)', // blue-500
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              minHeight: 48,
              color: isDarkMode 
                ? 'rgb(156, 163, 175)' // gray-400
                : 'rgb(75, 85, 99)', // gray-600
              '&:hover': {
                color: isDarkMode 
                  ? 'rgb(243, 244, 246)' // gray-100
                  : 'rgb(31, 41, 55)', // gray-800
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
              '&.Mui-selected': {
                color: isDarkMode 
                  ? 'rgb(96, 165, 250)' // blue-400
                  : 'rgb(59, 130, 246)', // blue-500
                fontWeight: 600,
              },
              transition: 'color 0.2s ease, background-color 0.2s ease',
            }
          }}
        >
          {allTabs.map((tab) => (
            <Tab
              key={tab.path}
              label={tab.label}
              onClick={() => router.push(tab.path)}
              sx={{
                mx: 0.5,
                borderRadius: 1,
                '&:first-of-type': {
                  ml: 0
                }
              }}
            />
          ))}
        </Tabs>
      </Container>
    </Box>
  );
}