'use client'
import { Box, Button, Typography, useTheme } from '@mui/material';
import Dashboard from '@/components/mmt/Dashboard';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import { User } from 'lucide-react';

export default function MMTPage() {
 const { isAuthenticated, user: web3authUser, login } = useWeb3Auth();
 const theme = useTheme();

 if (!isAuthenticated || !web3authUser?.wallet) {
   return (
     <Box 
       sx={{ 
         display: 'flex', 
         flexDirection: 'column',
         alignItems: 'center',
         justifyContent: 'center',
         minHeight: '60vh',
         bgcolor: theme.palette.background.default,
         color: theme.palette.text.primary
       }}
     >
       <Typography variant="h5" component="h1" gutterBottom>
         Please connect your wallet to use the Market Making Tool
       </Typography>
       <Button 
         variant="contained" 
         onClick={login}
         sx={{ 
           mt: 2,
           background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
           '&:hover': {
             background: 'linear-gradient(to right, #2563eb, #7c3aed)'
           }
         }}
         startIcon={<User />}
       >
         Login with Web3Auth
       </Button>
     </Box>
   );
 }

 return <Dashboard />;
}