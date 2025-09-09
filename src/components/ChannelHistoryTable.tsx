'use client';

import { useState } from 'react';
import { ChannelHistoryWithDetails } from '@/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ChannelHistoryTableProps {
  weeklyHistory: ChannelHistoryWithDetails[];
  monthlyHistory: ChannelHistoryWithDetails[];
}

export function ChannelHistoryTable({ weeklyHistory, monthlyHistory }: ChannelHistoryTableProps) {
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>('weekly');
  
  const currentHistory = activePeriod === 'weekly' ? weeklyHistory : monthlyHistory;
  
  // Sort history by start date (newest to oldest)
  const sortedHistory = [...currentHistory].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <span className="flex items-center text-green-600">
          <ArrowUp className="w-3 h-3 mr-1" />
          {formatNumber(growth)}
        </span>
      );
    } else if (growth < 0) {
      return (
        <span className="flex items-center text-red-600">
          <ArrowDown className="w-3 h-3 mr-1" />
          {formatNumber(Math.abs(growth))}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-gray-500">
          <Minus className="w-3 h-3 mr-1" />
          0
        </span>
      );
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Channel History
        </h3>
        <div className="flex rounded-md overflow-hidden">
          <button
            onClick={() => setActivePeriod('weekly')}
            className={`px-3 py-1 text-sm ${
              activePeriod === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActivePeriod('monthly')}
            className={`px-3 py-1 text-sm ${
              activePeriod === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {sortedHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribers
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedHistory.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(item.startDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {formatDate(item.endDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(item.subscriptionCount)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      {renderGrowthIndicator(item.subscriptionGrowth)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(item.clickCount)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      {renderGrowthIndicator(item.clickGrowth)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500 mb-2">No history data available</p>
          <p className="text-sm text-gray-400">
            Statistics will be generated as the channel receives activity
          </p>
        </div>
      )}
    </div>
  );
}