// components/airdrops/types.ts
export interface Campaign {
  id: number;
  title: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  amount: string;
  total_recipients: number;
  completed_recipients: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  creator_wallet: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignInput {
  title: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  amount: string;
  total_recipients: number;
  creator_wallet: string;
}