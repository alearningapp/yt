'use client';

import { useState } from 'react';
import { ChannelHistoryWithDetails } from '@/types';
import { ChannelHistoryChart } from './ChannelHistoryChart';
import { ChannelHistoryTable } from './ChannelHistoryTable';
import { BarChart, List } from 'lucide-react';

interface ChannelHistoryProps {
  channelHistory: ChannelHistoryWithDetails[];
}

export function ChannelHistory({ channelHistory }: ChannelHistoryProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Separate weekly and monthly history
  const weeklyHistory = channelHistory.filter(item => item.period === 'weekly');
  const monthlyHistory = channelHistory.filter(item => item.period === 'monthly');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Channel Statistics History</h3>
        <div className="flex rounded-md overflow-hidden border border-gray-200">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 flex items-center gap-1 ${
              viewMode === 'chart'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            <BarChart className="w-4 h-4" />
            Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 flex items-center gap-1 ${
              viewMode === 'table'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <ChannelHistoryChart 
          weeklyHistory={weeklyHistory} 
          monthlyHistory={monthlyHistory} 
        />
      ) : (
        <ChannelHistoryTable 
          weeklyHistory={weeklyHistory} 
          monthlyHistory={monthlyHistory} 
        />
      )}
    </div>
  );
}