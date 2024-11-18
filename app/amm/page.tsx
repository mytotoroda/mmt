// app/amm/page.tsx
'use client';

import React from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Paper,
  useTheme 
} from '@mui/material';
import SwapCard from '@/components/amm/SwapCard';
import { useAMM } from '@/contexts/AMMContext';

export default function AMMPage() {
  const { pools, loading } = useAMM();
  const theme = useTheme();

  const paperStyle = {
    height: '100%',
    p: 3,
    bgcolor: 'background.paper',
    borderRadius: 2,
    border: 1,
    borderColor: 'divider',
  };

  const statBoxStyle = {
    p: 2,
    textAlign: 'center',
    bgcolor: 'background.default',
    borderRadius: 2,
    border: 1,
    borderColor: theme.palette.divider,
  };

  return (
    <Box sx={{
      bgcolor: 'background.default',
      minHeight: '100%',
      py: 3
    }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h5"
            component="h1" 
            sx={{ 
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            토큰 스왑
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}
          >
            Solana 네트워크에서 토큰을 빠르고 효율적으로 교환하세요
          </Typography>
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Swap Card Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={paperStyle}>
              <SwapCard />
            </Paper>
          </Grid>

          {/* Stats Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={paperStyle}>
              <Typography 
                variant="h6"
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '1.125rem'
                }}
              >
                거래 통계
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={statBoxStyle}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        mb: 1,
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.813rem'
                      }}
                    >
                      활성 풀
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontWeight: 700,
                        color: 'primary.main',
                        fontSize: '1.25rem'
                      }}
                    >
                      {pools.length}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={statBoxStyle}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        mb: 1,
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.813rem'
                      }}
                    >
                      24시간 거래량
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontWeight: 700,
                        color: 'primary.main',
                        fontSize: '1.25rem'
                      }}
                    >
                      $0.00
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={statBoxStyle}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        mb: 1,
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.813rem'
                      }}
                    >
                      네트워크
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontWeight: 700,
                        color: 'primary.main',
                        fontSize: '1.25rem'
                      }}
                    >
                      {process.env.NEXT_PUBLIC_NETWORK === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}