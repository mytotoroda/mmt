'use client'
import { useState } from 'react';
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import CampaignList from '@/components/airdrops/CampaignList';
import CampaignCreate from '@/components/airdrops/CampaignCreate';
import CampaignEdit from '@/components/airdrops/CampaignEdit';
import { Campaign } from '@/components/airdrops/types';

export default function AirdropsPage() {
  const { isAuthenticated, isLoading, user, login } = useWeb3Auth();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">연결 중...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">지갑 연결이 필요합니다</h2>
            <p className="text-gray-600 mb-6">에어드랍 관리를 위해 지갑을 연결해주세요.</p>
            <button
              onClick={() => login()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center mx-auto space-x-2"
            >
              <span>지갑 연결하기</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              에어드랍 관리
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              연결된 지갑: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </p>
          </div>
          
          {mode === 'list' && (
            <button
              onClick={() => setMode('create')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
            >
              새 캠페인 만들기
            </button>
          )}
        </div>

        {mode === 'list' && (
          <CampaignList
            onEditClick={(campaign) => {
              setSelectedCampaign(campaign);
              setMode('edit');
            }}
          />
        )}
        
        {mode === 'create' && (
          <CampaignCreate
            onSuccess={() => {
              setMode('list');
            }}
          />
        )}
        
        {mode === 'edit' && selectedCampaign && (
          <CampaignEdit
            campaign={selectedCampaign}
            onSuccess={() => {
              setMode('list');
              setSelectedCampaign(null);
            }}
            onCancel={() => {
              setMode('list');
              setSelectedCampaign(null);
            }}
          />
        )}
      </div>
    );
  };

  return renderContent();
}