import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Autocomplete, 
  Typography, 
  Avatar,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Coins } from 'lucide-react';

interface TokenPair {
  id: string;
  symbol: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
  };
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
  };
  lastPrice: number;
  priceChangePercent24h: number;
}

interface TokenPairSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const TokenPairSelect: React.FC<TokenPairSelectProps> = ({ value, onChange }) => {
  const theme = useTheme();
  const [pairs, setPairs] = useState<TokenPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedPair, setSelectedPair] = useState<TokenPair | null>(null);

  useEffect(() => {
    fetchTokenPairs();
  }, []);

  useEffect(() => {
    if (value && pairs.length > 0) {
      const pair = pairs.find(p => p.id === value);
      setSelectedPair(pair || null);
    }
  }, [value, pairs]);

  const fetchTokenPairs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mmt/token-pairs');
      if (response.ok) {
        const data = await response.json();
        setPairs(data);
        
        // If there's no selected value and we have pairs, select the first one
        if (!value && data.length > 0) {
          onChange(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch token pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        mb: 2
      }}>
        <Coins size={20} />
        <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
          Select Token Pair
        </Typography>
      </Box>

      <Autocomplete
        value={selectedPair}
        onChange={(_, newValue) => {
          setSelectedPair(newValue);
          if (newValue) {
            onChange(newValue.id);
          }
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        options={pairs}
        loading={loading}
        getOptionLabel={(option) => `${option.baseToken.symbol}/${option.quoteToken.symbol}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search token pairs..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'divider'
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            sx={{
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {option.baseToken.logoURI && (
                    <Avatar 
                      src={option.baseToken.logoURI} 
                      alt={option.baseToken.symbol}
                      sx={{ width: 24, height: 24 }}
                    />
                  )}
                  <Typography variant="body1">
                    {option.baseToken.symbol}
                  </Typography>
                </Box>
                <Typography color="text.secondary">/</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {option.quoteToken.logoURI && (
                    <Avatar 
                      src={option.quoteToken.logoURI} 
                      alt={option.quoteToken.symbol}
                      sx={{ width: 24, height: 24 }}
                    />
                  )}
                  <Typography variant="body1">
                    {option.quoteToken.symbol}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end'
              }}>
                <Typography variant="body2">
                  ${formatPrice(option.lastPrice)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: option.priceChangePercent24h >= 0 
                      ? 'success.main' 
                      : 'error.main'
                  }}
                >
                  {option.priceChangePercent24h >= 0 ? '+' : ''}
                  {option.priceChangePercent24h.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        fullWidth
      />

      {selectedPair && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Selected Pair Details
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Base Token
              </Typography>
              <Typography variant="body1">
                {selectedPair.baseToken.name} ({selectedPair.baseToken.symbol})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {selectedPair.baseToken.address}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Quote Token
              </Typography>
              <Typography variant="body1">
                {selectedPair.quoteToken.name} ({selectedPair.quoteToken.symbol})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {selectedPair.quoteToken.address}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TokenPairSelect;