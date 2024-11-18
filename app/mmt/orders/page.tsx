// app/mmt/orders/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { formatNumber } from '@/utils/mmt/formatters';
import { 
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
  Button,
  Stack,
  CircularProgress
} from '@mui/material';
import { useTheme as useNextTheme } from 'next-themes';
import { Info, TrendingUp, TrendingDown, Search, X } from 'lucide-react';

interface Transaction {
  id: number;
  created_at: string;
  token_a_symbol: string;
  token_b_symbol: string;
  action_type: 'SWAP' | 'REBALANCE';
  direction: 'BUY' | 'SELL';
  amount: number;
  price: number;
  gas_used: number;
  status: 'SUCCESS' | 'FAILED';
  tx_signature: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

interface FilterState {
  search: string;
  status?: 'SUCCESS' | 'FAILED' | '';
  direction?: 'BUY' | 'SELL' | '';
  action_type?: 'SWAP' | 'REBALANCE' | '';
}

export default function OrdersPage() {
  const muiTheme = useTheme();
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  
  // 상태 관리
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    limit: 10,
    total: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    direction: '',
    action_type: ''
  });
  
  // 데이터 가져오기
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (pagination.page + 1).toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.direction && { direction: filters.direction }),
        ...(filters.action_type && { action_type: filters.action_type })
      });

      const response = await fetch(`/api/mmt/transactions?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터나 페이지 변경시 데이터 새로고침
  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [pagination.page, pagination.limit, filters]);

  // 페이지 변경 핸들러
  const handlePageChange = (event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 페이지당 행 수 변경 핸들러
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // 검색어 변경 핸들러 (디바운스 적용)
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilters(prev => ({ ...prev, search: value }));
  };

  // 필터 초기화
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      direction: '',
      action_type: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // 상태별 색상 및 아이콘
  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' ? 'success' : 'error';
  };

  const DirectionIcon = ({ direction }: { direction: string }) => {
    return direction === 'BUY' ? (
      <TrendingUp color={muiTheme.palette.success.main} size={20} />
    ) : (
      <TrendingDown color={muiTheme.palette.error.main} size={20} />
    );
  };

  // 검색 필터 섹션 스타일
  const filterSectionStyles = {
    p: 3,
    mb: 3,
    bgcolor: isDark ? 'rgb(17, 24, 39)' : 'white',
    border: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 검색 및 필터 섹션 */}
      <Paper elevation={0} sx={filterSectionStyles}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="TX 서명으로 검색..."
            value={filters.search}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? 'rgb(31, 41, 55)' : 'white',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearFilters}
            startIcon={<X size={18} />}
            sx={{
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            필터 초기화
          </Button>
        </Stack>
      </Paper>

      {/* 트랜잭션 테이블 */}
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          bgcolor: isDark ? 'rgb(17, 24, 39)' : 'white',
          border: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h5" component="h1" 
            sx={{ 
              color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
              fontWeight: 600 
            }}
          >
            AMM 트랜잭션 내역
          </Typography>
          {loading && <CircularProgress size={24} />}
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>시간</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>풀</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>유형</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>방향</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>수량</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>가격</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>가스비용</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>상태</TableCell>
                <TableCell sx={{ color: isDark ? 'rgb(209, 213, 219)' : 'inherit' }}>TX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell sx={{ color: isDark ? 'rgb(243, 244, 246)' : 'inherit' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: isDark ? 'rgb(243, 244, 246)' : 'inherit' }}>
                    {`${tx.token_a_symbol}/${tx.token_b_symbol}`}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tx.action_type}
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
                        borderRadius: 1
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DirectionIcon direction={tx.direction} />
                      {tx.direction}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: isDark ? 'rgb(243, 244, 246)' : 'inherit' }}>
                    {formatNumber(tx.amount)}
                  </TableCell>
                  <TableCell sx={{ color: isDark ? 'rgb(243, 244, 246)' : 'inherit' }}>
                    {formatNumber(tx.price)}
                  </TableCell>
                  <TableCell sx={{ color: isDark ? 'rgb(243, 244, 246)' : 'inherit' }}>
                    {formatNumber(tx.gas_used)} SOL
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tx.status}
                      size="small"
                      color={getStatusColor(tx.status)}
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => window.open(`https://solscan.io/tx/${tx.tx_signature}`, '_blank')}
                      sx={{ 
                        color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    >
                      <Info size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="페이지당 행:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / 전체 ${count !== -1 ? count : `${to} 이상`}`
          }
          sx={{
            color: isDark ? 'rgb(209, 213, 219)' : 'inherit',
            '.MuiTablePagination-select': {
              color: isDark ? 'rgb(209, 213, 219)' : 'inherit'
            },
            '.MuiTablePagination-selectIcon': {
              color: isDark ? 'rgb(209, 213, 219)' : 'inherit'
            }
          }}
        />
      </Paper>
    </Container>
  );
}