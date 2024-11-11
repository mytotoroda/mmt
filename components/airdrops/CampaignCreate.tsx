import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CardHeader
} from '@mui/material';

interface CampaignInput {
  title: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  amount: string;
  total_recipients: number;
  creator_wallet: string;
}

export default function CampaignCreate({
  onSuccess
}: {
  onSuccess: () => void;
}) {
  const { publicKey } = useWallet();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CampaignInput>({
    title: '',
    token_address: '',
    token_name: '',
    token_symbol: '',
    amount: '',
    total_recipients: 0,
    creator_wallet: publicKey || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CampaignInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'total_recipients' 
      ? parseInt(e.target.value) || 0
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
      <CardHeader
        title={
          <Typography variant="h5" component="h2">
            Create New Airdrop Campaign
          </Typography>
        }
      />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Campaign Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
                variant="outlined"
                placeholder="Enter campaign title"
              />
            </Grid>

            {/* Token Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Token Address"
                value={formData.token_address}
                onChange={handleChange('token_address')}
                required
                variant="outlined"
                placeholder="Enter token contract address"
              />
            </Grid>

            {/* Token Name and Symbol */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Token Name"
                value={formData.token_name}
                onChange={handleChange('token_name')}
                required
                variant="outlined"
                placeholder="e.g. Solana"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Token Symbol"
                value={formData.token_symbol}
                onChange={handleChange('token_symbol')}
                required
                variant="outlined"
                placeholder="e.g. SOL"
              />
            </Grid>

            {/* Amount and Recipients */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount Per Recipient"
                type="text"
                value={formData.amount}
                onChange={handleChange('amount')}
                required
                variant="outlined"
                placeholder="Enter amount"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Recipients"
                type="number"
                value={formData.total_recipients}
                onChange={handleChange('total_recipients')}
                required
                variant="outlined"
                inputProps={{ min: 0 }}
                placeholder="Enter number of recipients"
              />
            </Grid>

            {/* Error Alert */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}