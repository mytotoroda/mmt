import React, { useState, useEffect } from 'react';
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
import { BookOpen } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface Order {
  price: number;
  size: number;
  total: number;
  isMine: boolean;
}

interface OrderBookProps {
  tokenPair: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ tokenPair }) => {
  const theme = useTheme();
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState(0);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenPair) {
      fetchOrderBook();
      // WebSocket 연결 설정
      const ws = new WebSocket(`ws://${window.location.host}/api/mmt/orderbook`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateOrderBook(data);
      };

      return () => {
        ws.close();
      };
    }
  }, [tokenPair]);

  const fetchOrderBook = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mmt/orders?tokenPair=${tokenPair}`);
      if (response.ok) {
        const data = await response.json();
        updateOrderBook(data);
      }
    } catch (error) {
      console.error('Failed to fetch order book:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderBook = (data: { buys: Order[]; sells: Order[] }) => {
    setBuyOrders(data.buys);
    setSellOrders(data.sells);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  };

  const renderOrderTable = (orders: Order[], type: 'buy' | 'sell') => {
    const ordersToShow = type === 'sell' ? [...orders].reverse() : orders;
    const textColor = type === 'buy' ? theme.palette.success.main : theme.palette.error.main;

    return (
      <TableContainer component={Paper} 
        sx={{ 
          bgcolor: 'background.paper',
          maxHeight: 400,
          '& .MuiTableCell-root': {
            py: 1,
            px: 2,
            borderColor: 'divider'
          }
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary' }}>Price</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary' }}>Size</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordersToShow.map((order, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  bgcolor: order.isMine ? alpha(textColor, 0.1) : 'inherit',
                  '&:hover': {
                    bgcolor: alpha(textColor, 0.05)
                  }
                }}
              >
                <TableCell sx={{ color: textColor }}>
                  {formatNumber(order.price)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.primary' }}>
                  {formatNumber(order.size)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.primary' }}>
                  {formatNumber(order.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: 2
      }}>
        <BookOpen size={20} />
        <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
          Order Book
        </Typography>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main'
            }
          }
        }}
      >
        <Tab label="All Orders" />
        <Tab label="Buy Orders" />
        <Tab label="Sell Orders" />
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderOrderTable(sellOrders, 'sell')}
            <Box sx={{ 
              py: 2, 
              textAlign: 'center',
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>
                {formatNumber(buyOrders[0]?.price || 0)}
              </Typography>
            </Box>
            {renderOrderTable(buyOrders, 'buy')}
          </Box>
        )}
        {activeTab === 1 && renderOrderTable(buyOrders, 'buy')}
        {activeTab === 2 && renderOrderTable(sellOrders, 'sell')}
      </Box>
    </Box>
  );
};

export default OrderBook;