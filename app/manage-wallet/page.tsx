'use client'
import React, { useState, useEffect } from 'react';
import { useFormatBalance } from '@/hooks/useFormatBalance';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Pagination,
  Stack,
  Alert,
  LinearProgress,
  MenuItem,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon 
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';


import { 
  Connection, 
  PublicKey, 
  Transaction 
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

const getRpcUrl = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta';
  return network === 'mainnet-beta' 
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL
    : process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
};



interface Wallet {
  id: number;
  wallet_name: string;
  pool_name: string;
  pool_address: string;
  public_key: string;
  private_key: string;
  sol_balance: number;
  min_sol_balance: number;
  token_mint: string;
  token_ata: string;
  token_ata: string | null;
  token_balance: number;
  token_symbol: string | null;
  token_decimals: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_test_wallet: boolean;
  last_balance_update: number | null;
  last_transaction_hash: string | null;
  last_transaction_time: number | null;
  daily_transaction_count: number;
  total_transaction_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface WalletFormData {
  wallet_name: string;
  pool_name: string;
  pool_address: string;
  public_key: string;
  private_key: string;
  min_sol_balance: number;
  token_mint: string;
  token_ata: string;
  token_symbol: string;
  token_decimals: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_test_wallet: boolean;
}

const initialFormData: WalletFormData = {
  wallet_name: '',
  pool_name: '',
  pool_address: '',
  public_key: '',
  private_key: '',
  min_sol_balance: 1,
  token_mint: '',
  token_ata: '',
  token_symbol: '',
  token_decimals: 9,
  status: 'ACTIVE',
  risk_level: 'LOW',
  is_test_wallet: false
};

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WalletManagementPage() {
  const { provider, isAuthenticated } = useWeb3Auth();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<WalletFormData>(initialFormData);
  const formatBalance = useFormatBalance();
  const [updatingWallets, setUpdatingWallets] = useState<Set<string>>(new Set());
  const [creatingAta, setCreatingAta] = useState<Set<string>>(new Set());

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manage-wallet?page=${page}&limit=${limit}&search=${search}`);
      
      if (!response.ok) throw new Error('Failed to fetch wallets');
      
      const data = await response.json();
      setWallets(data.wallets);
      setTotalCount(data.total);
      setTotalPages(Math.ceil(data.total / limit));
      setError(null);
    } catch (err) {
      setError('Failed to load wallets');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page, limit, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingWallet 
      ? `/api/manage-wallet/${editingWallet.id}`
      : '/api/manage-wallet';
      
    const method = editingWallet ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save wallet');
      
      setOpenDialog(false);
      fetchWallets();
      resetForm();
    } catch (error) {
      setError('Failed to save wallet');
      console.error('Error:', error);
    }
  };

  const handleUpdateBalance = async (publicKey: string) => {
    try {
      setUpdatingWallets(prev => new Set(prev).add(publicKey));
      
      const response = await fetch('/api/manage-wallet/update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }

      await fetchWallets();
      
    } catch (error) {
      console.error('Error updating balance:', error);
      setError('Failed to update wallet balance');
    } finally {
      setUpdatingWallets(prev => {
        const newSet = new Set(prev);
        newSet.delete(publicKey);
        return newSet;
      });
    }
  };


///////////////////
const handleCreateAta = async (wallet: Wallet) => {
  if (!isAuthenticated || !provider) {
    setError('Please connect your wallet first');
    return;
  }

  try {
    setCreatingAta(prev => new Set(prev).add(wallet.public_key));

    // Solana connection 설정
    const connection = new Connection(getRpcUrl(), {
      commitment: 'confirmed',
    });

    // Create the ATA account instruction
    const walletPubkey = new PublicKey(wallet.public_key);
    const mintPubkey = new PublicKey(wallet.token_mint);
    
    // Get the ATA address
    const ataAddress = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create the instruction
    const instruction = createAssociatedTokenAccountInstruction(
      walletPubkey,  // payer
      ataAddress,    // ata
      walletPubkey,  // owner
      mintPubkey     // mint
    );

    // Create transaction
    const transaction = new Transaction().add(instruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;

    // Web3Auth 트랜잭션 서명 방식
    try {
      const signedTx = await provider.request({
        method: "signAndSendTransaction",
        params: {
          message: Buffer.from(transaction.serializeMessage()).toString('base64'),
        },
      });

      if (signedTx) {
        // ATA가 생성되면 DB 업데이트
        const updateResponse = await fetch('/api/manage-wallet/update-ata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: wallet.public_key,
            ataAddress: ataAddress.toString(),
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update ATA in database');
        }

        // 트랜잭션 완료 확인
        await connection.confirmTransaction(signedTx as string, 'confirmed');
        await fetchWallets();
        setError(null);
      }
    } catch (err) {
      console.error('Transaction error:', err);
      throw err;
    }

  } catch (error) {
    console.error('Error creating ATA:', error);
    setError('Failed to create Associated Token Account');
  } finally {
    setCreatingAta(prev => {
      const newSet = new Set(prev);
      newSet.delete(wallet.public_key);
      return newSet;
    });
  }
};

///////////////////////////////////////////////////////////////////

const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return;
    
    try {
      const response = await fetch(`/api/manage-wallet/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete wallet');
      
      fetchWallets();
    } catch (error) {
      setError('Failed to delete wallet');
      console.error('Error:', error);
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      wallet_name: wallet.wallet_name,
      pool_name: wallet.pool_name,
      pool_address: wallet.pool_address,
      public_key: wallet.public_key,
      private_key: '',
      min_sol_balance: wallet.min_sol_balance,
      token_mint: wallet.token_mint,
      token_ata: wallet.token_ata,
      token_symbol: wallet.token_symbol || '',
      token_decimals: wallet.token_decimals,
      status: wallet.status,
      risk_level: wallet.risk_level,
      is_test_wallet: wallet.is_test_wallet
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setEditingWallet(null);
    setFormData(initialFormData);
  };

  const handleCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Wallet Management
        </Typography>
        <TextField
          placeholder="Search by name or address..."
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Items per page</InputLabel>
          <Select
            value={limit}
            label="Items per page"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleCreate}>
          Add New Wallet
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Pool</TableCell>
              <TableCell>Public Key</TableCell>
              <TableCell>SOL Balance</TableCell>
              <TableCell>Token Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Risk Level</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet.id}>
                <TableCell>{wallet.wallet_name}</TableCell>
                <TableCell>{wallet.pool_name}</TableCell>
                <TableCell>{wallet.public_key}</TableCell>
                <TableCell>{formatBalance(wallet.sol_balance)}</TableCell>
                <TableCell>
                  {wallet.token_ata ? (
                    formatBalance(wallet.token_balance)
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No ATA
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{wallet.status}</TableCell>
                <TableCell>{wallet.risk_level}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleUpdateBalance(wallet.public_key)} 
                    color="info" 
                    size="small" 
                    title="Update Balance"
                    disabled={updatingWallets.has(wallet.public_key)}
                  >
                    <RefreshIcon 
                      sx={{
                        animation: updatingWallets.has(wallet.public_key) ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                  
                  {!wallet.token_ata && (
                    <Tooltip title="Create Associated Token Account">
                      <IconButton
                        onClick={() => handleCreateAta(wallet)}
                        color="success"
                        size="small"
                        disabled={creatingAta.has(wallet.public_key) || !isAuthenticated}
                      >
                        {creatingAta.has(wallet.public_key) ? (
                          <CircularProgress size={20} />
                        ) : (
                          <AccountBalanceWalletIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

                  <IconButton onClick={() => handleEdit(wallet)} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(wallet.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total: {totalCount} wallets
        </Typography>
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingWallet ? 'Edit Wallet' : 'Create New Wallet'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Wallet Name"
                value={formData.wallet_name}
                onChange={(e) => setFormData({ ...formData, wallet_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Pool Name"
                value={formData.pool_name}
                onChange={(e) => setFormData({ ...formData, pool_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Pool Address"
                value={formData.pool_address}
                onChange={(e) => setFormData({ ...formData, pool_address: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Public Key"
                value={formData.public_key}
                onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
                required
                fullWidth
              />
              {!editingWallet && (
                <TextField
                  label="Private Key"
                  value={formData.private_key}
                  onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                  type="password"
                  required
                  fullWidth
                />
              )}
              <TextField
                label="Min SOL Balance"
                value={formData.min_sol_balance}
                onChange={(e) => setFormData({ ...formData, min_sol_balance: Number(e.target.value) })}
                type="number"
                required
                fullWidth
              />
              <TextField
                label="Token Mint"
                value={formData.token_mint}
                onChange={(e) => setFormData({ ...formData, token_mint: e.target.value })}
                required
                fullWidth
              />
	      <TextField
                label="Token Ata"
                value={formData.token_ata}
                onChange={(e) => setFormData({ ...formData, token_ata: e.target.value })}
                fullWidth
              />
              <TextField
                label="Token Symbol"
                value={formData.token_symbol}
                onChange={(e) => setFormData({ ...formData, token_symbol: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                fullWidth
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Risk Level"
                value={formData.risk_level}
                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as any })}
                fullWidth
              >
                {RISK_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_test_wallet}
                    onChange={(e) => setFormData({ ...formData, is_test_wallet: e.target.checked })}
                  />
                }
                label="Test Wallet"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingWallet ? 'Save Changes' : 'Create Wallet'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
