import { useState, useEffect } from 'react';
import { Campaign } from './types';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Box,
  Skeleton,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

interface CampaignListProps {
  onEditClick: (campaign: Campaign) => void;
}

const StatusChip = ({ status }: { status: Campaign['status'] }) => {
  const getStatusConfig = (status: Campaign['status']) => {
    switch (status) {
      case 'COMPLETED':
        return { 
          label: '완료됨', 
          color: 'success' as const, 
          icon: <CheckCircleIcon sx={{ width: 16, height: 16 }} />
        };
      case 'FAILED':
        return { 
          label: '실패', 
          color: 'error' as const, 
          icon: <ErrorIcon sx={{ width: 16, height: 16 }} />
        };
      case 'IN_PROGRESS':
        return { 
          label: '진행중', 
          color: 'info' as const, 
          icon: <PlayArrowIcon sx={{ width: 16, height: 16 }} />
        };
      default:
        return { 
          label: '대기중', 
          color: 'default' as const, 
          icon: <PendingIcon sx={{ width: 16, height: 16 }} />
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ 
        '& .MuiChip-icon': { 
          marginLeft: '8px',
        }
      }}
    />
  );
};

export default function CampaignList({ onEditClick }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      
      const campaignsList = data.data || data;
      if (Array.isArray(campaignsList)) {
        setCampaigns(campaignsList);
      } else {
        console.error('Unexpected data format:', data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" height={20} sx={{ mt: 2 }} />
              </CardContent>
              <CardActions>
                <Skeleton variant="rectangular" width={80} height={36} />
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={300}
        textAlign="center"
        sx={{
          color: 'text.secondary',
          p: 3,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          borderStyle: 'dashed'
        }}
      >
        <Typography variant="h6" gutterBottom>
          아직 생성된 캠페인이 없습니다
        </Typography>
        <Typography variant="body2">
          새 캠페인 만들기 버튼을 클릭하여 첫 캠페인을 생성해보세요!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {campaigns.map((campaign) => (
        <Grid item xs={12} sm={6} md={4} key={campaign.id}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" component="h3" sx={{ 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  mb: 1
                }}>
                  {campaign.title}
                </Typography>
                <StatusChip status={campaign.status} />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Token: {campaign.token_name} ({campaign.token_symbol})
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Amount: {campaign.amount}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Recipients: {campaign.completed_recipients}/{campaign.total_recipients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((campaign.completed_recipients / campaign.total_recipients) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(campaign.completed_recipients / campaign.total_recipients) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => onEditClick(campaign)}
                fullWidth
                sx={{
                  textTransform: 'none',
                }}
              >
                Edit Campaign
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}