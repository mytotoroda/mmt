import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CardHeader,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface Campaign {
  id: number;
  title: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  amount: string;
  total_recipients: number;
  completed_recipients: number;
  creator_wallet: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

interface CampaignInput {
  title: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  amount: string;
  total_recipients: number;
  completed_recipients: number;
  creator_wallet: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기중' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료됨' },
  { value: 'FAILED', label: '실패' }
] as const;

export default function CampaignEdit({
  campaign,
  onSuccess,
  onCancel
}: {
  campaign: Campaign;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const [formData, setFormData] = useState<CampaignInput>({
    title: campaign.title,
    token_address: campaign.token_address,
    token_name: campaign.token_name,
    token_symbol: campaign.token_symbol,
    amount: campaign.amount,
    total_recipients: campaign.total_recipients,
    completed_recipients: campaign.completed_recipients,
    creator_wallet: campaign.creator_wallet,
    status: campaign.status
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowError(false);
    
    // 완료된 수신자가 총 수신자보다 많은지 검증
    if (formData.completed_recipients > formData.total_recipients) {
      setError('완료된 수신자 수가 총 수신자 수를 초과할 수 없습니다.');
      setShowError(true);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `Failed to update campaign (${response.status})`
        );
      }
      
      const updatedData = await response.json();
      onSuccess();
    } catch (error) {
      console.error('Failed to update campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to update campaign');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CampaignInput) => (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const value = field === 'total_recipients' || field === 'completed_recipients'
      ? parseInt(e.target.value as string) || 0
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  // 진행률 계산
  const progressPercentage = (formData.completed_recipients / formData.total_recipients) * 100;

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
      <CardHeader
        title={
          <Typography variant="h5" component="h2">
            Edit Airdrop Campaign
          </Typography>
        }
      />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
                variant="outlined"
                placeholder="Enter campaign title"
                error={error.includes('title')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Token Address"
                value={formData.token_address}
                onChange={handleChange('token_address')}
                required
                variant="outlined"
                placeholder="Enter token contract address"
                error={error.includes('address')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Token Name"
                value={formData.token_name}
                onChange={handleChange('token_name')}
                required
                variant="outlined"
                placeholder="e.g. Solana"
                error={error.includes('name')}
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
                error={error.includes('symbol')}
              />
            </Grid>

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
                error={error.includes('amount')}
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
                error={error.includes('recipients')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  label="Completed Recipients"
                  type="number"
                  value={formData.completed_recipients}
                  onChange={handleChange('completed_recipients')}
                  required
                  variant="outlined"
                  inputProps={{ 
                    min: 0,
                    max: formData.total_recipients 
                  }}
                  error={formData.completed_recipients > formData.total_recipients}
                  helperText={formData.completed_recipients > formData.total_recipients ? 
                    "Cannot exceed total recipients" : ""}
                />
                <Tooltip title="현재까지 에어드랍이 완료된 수신자 수">
                  <InfoIcon color="action" />
                </Tooltip>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange('status')}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    진행률
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(progressPercentage)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercentage}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </Grid>

            {error && showError && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={handleCloseError}>
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Updating...' : 'Update Campaign'}
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outlined"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}