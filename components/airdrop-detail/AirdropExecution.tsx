import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';

interface AirdropExecutionProps {
  campaignId: string;
}

export default function AirdropExecution({ campaignId }: AirdropExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
  }>({ total: 0, completed: 0, failed: 0 });

  const executeAirdrop = async () => {
    try {
      setIsExecuting(true);
      setStatus('processing');
      const response = await fetch(`/api/airdrop/${campaignId}/execute`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('completed');
        setProgress(data.progress);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Airdrop execution failed:', error);
      setStatus('error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Box>
      <Paper 
        variant="outlined" 
        className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <Typography 
          variant="h6" 
          gutterBottom
          className="text-gray-900 dark:text-gray-100 font-semibold"
        >
          에어드랍 실행
        </Typography>
        
        <Typography 
          variant="body2" 
          className="text-gray-600 dark:text-gray-400 mb-4"
          paragraph
        >
          등록된 주소로 토큰을 전송합니다. 실행 후에는 취소할 수 없습니다.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          disabled={isExecuting}
          onClick={executeAirdrop}
          className="mt-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {isExecuting ? (
            <>
              <CircularProgress 
                size={24} 
                className="mr-2 text-white"
              />
              실행 중...
            </>
          ) : (
            '에어드랍 실행'
          )}
        </Button>
      </Paper>

      {status !== 'idle' && (
        <Paper 
          variant="outlined" 
          className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <Typography 
            variant="h6" 
            gutterBottom
            className="text-gray-900 dark:text-gray-100 font-semibold"
          >
            실행 현황
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <PendingIcon className="text-blue-500 dark:text-blue-400" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <span className="text-gray-900 dark:text-gray-100">총 처리 대상</span>
                }
                secondary={
                  <span className="text-gray-600 dark:text-gray-400">{progress.total}개</span>
                }
              />
            </ListItem>

            <Divider className="border-gray-200 dark:border-gray-700" />

            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon className="text-green-500 dark:text-green-400" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <span className="text-gray-900 dark:text-gray-100">성공</span>
                }
                secondary={
                  <span className="text-gray-600 dark:text-gray-400">{progress.completed}개</span>
                }
              />
            </ListItem>

            <Divider className="border-gray-200 dark:border-gray-700" />

            <ListItem>
              <ListItemIcon>
                <ErrorIcon className="text-red-500 dark:text-red-400" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <span className="text-gray-900 dark:text-gray-100">실패</span>
                }
                secondary={
                  <span className="text-gray-600 dark:text-gray-400">{progress.failed}개</span>
                }
              />
            </ListItem>
          </List>

          {status === 'error' && (
            <Alert 
              severity="error" 
              className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            >
              <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
                에러 발생
              </AlertTitle>
              에어드랍 실행 중 오류가 발생했습니다. 다시 시도해주세요.
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
}