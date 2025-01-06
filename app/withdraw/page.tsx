'use client';

import { useState, useEffect } from 'react';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { SolanaWallet } from '@/contexts/Web3AuthContext';
import { 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Link,
  Divider
} from '@mui/material';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WithdrawalHistory {
  id: number;
  amount: number;
  destination_address: string;
  tx_signature: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export default function WithdrawPage() {


  const [destinationAddress, setDestinationAddress] = useState('7TVfvpf5hrMSWWYZs1Ayc2gzwhwamrF8axPGSKJC1PCr');
  const [amount, setAmount] = useState('0.001');

  const { user,provider } = useWeb3Auth();
  const { publicKey, connection, signAndSendTransaction } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = async () => {
    if (publicKey && connection) {
      try {
        const lamports = await connection.getBalance(new PublicKey(publicKey));
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdraw');
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchWithdrawals();
    const interval = setInterval(() => {
      fetchBalance();
      fetchWithdrawals();
    }, 60000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

////////////////////////////////////////////////////////////

const handleWithdraw = async () => {
  setError(null);
  setLoading(true);

  try {
    if (!amount || !destinationAddress) {
      throw new Error('Please enter both amount and destination address');
    }

    if (!publicKey || !provider) {
      throw new Error('Wallet not connected');
    }

    let toPublicKey: PublicKey;
    try {
      toPublicKey = new PublicKey(destinationAddress);
    } catch {
      throw new Error('Invalid destination address');
    }

    const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

    if (balance === null || lamports > balance * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient balance');
    }

    const transaction = new Transaction();
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(publicKey),
        toPubkey: toPublicKey,
        lamports: Math.floor(lamports),
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(publicKey);

    // Web3Auth provider로 트랜잭션 서명 및 전송
    const serializedMessage = transaction.serializeMessage();
    const messageBase64 = Buffer.from(serializedMessage).toString('base64');
	
	console.log(provider,"provider")

    const signedTx = await provider.request({
      method: "signTransaction",
      params: {
        message: messageBase64
      }
    });
	
	console.log(signedTx,"signedTx")
     const signature = await connection.sendRawTransaction(
      Buffer.from(signedTx as string, 'base64')
    );

    // 트랜잭션 확인
    const confirmation = await connection.confirmTransaction(signature as string);
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }

    // DB에 출금 기록 저장
    const response = await fetch('/api/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        destinationAddress,
        txSignature: signature,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to record withdrawal');
    }

    setAmount('');
    setDestinationAddress('');
    fetchBalance();
    fetchWithdrawals();

  } catch (err: any) {
    console.error('Withdrawal error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

/////////////////////////////
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success.main';
      case 'FAILED':
        return 'error.main';
      default:
        return 'warning.main';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* 출금 폼 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              Withdraw SOL
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" color="text.secondary">
                Available Balance
              </Typography>
              <Typography variant="h6" color="primary">
                {balance !== null ? `${balance.toFixed(9)} SOL` : 'Loading...'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ mt: 2 }}>
            <TextField
  fullWidth
  label="Destination Address"
  variant="outlined"
  value={destinationAddress}
  onChange={(e) => setDestinationAddress(e.target.value)}
  sx={{ mb: 2 }}
/>
<TextField
  fullWidth
  label="Amount (SOL)"
  type="number"
  variant="outlined"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  inputProps={{ 
    step: "0.000000001",
    min: "0",
    max: balance?.toString() || "0"
  }}
  sx={{ mb: 2 }}
/>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={handleWithdraw}
              disabled={loading || !publicKey || balance === null || balance === 0}
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 출금 내역 */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Recent Withdrawals
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Transaction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {withdrawal.amount.toFixed(9)} SOL
                    </TableCell>
                    <TableCell>
                      {`${withdrawal.destination_address.slice(0, 4)}...${withdrawal.destination_address.slice(-4)}`}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        component="span"
                        sx={{
                          color: getStatusColor(withdrawal.status),
                          fontWeight: 'medium'
                        }}
                      >
                        {withdrawal.status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {withdrawal.tx_signature ? (
                        <Link
                          href={`https://explorer.solana.com/tx/${withdrawal.tx_signature}${process.env.NEXT_PUBLIC_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main' }}
                        >
                          {`${withdrawal.tx_signature.slice(0, 4)}...${withdrawal.tx_signature.slice(-4)}`}
                        </Link>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}