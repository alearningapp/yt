'use client';

import { useState } from 'react';
import { ChannelHistoryWithDetails } from '@/types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChannelHistoryChartProps {
  weeklyHistory: ChannelHistoryWithDetails[];
  monthlyHistory: ChannelHistoryWithDetails[];
}

export function ChannelHistoryChart({ weeklyHistory, monthlyHistory }: ChannelHistoryChartProps) {
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [activeMetric, setActiveMetric] = useState<'subscriptions' | 'clicks'>('subscriptions');
  
  const formatDate = (date: Date) => {
    const d = new Date(date);
    if (activePeriod === 'weekly') {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } else {
      return `${d.getMonth() + 1}/${d.getFullYear()}`;
    }
  };

  const currentHistory = activePeriod === 'weekly' ? weeklyHistory : monthlyHistory;
  
  // Sort history by start date (oldest to newest)
  const sortedHistory = [...currentHistory].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const chartData: ChartData<'line'> = {
    labels: sortedHistory.map(item => formatDate(item.startDate)),
    datasets: [
      {
        label: activeMetric === 'subscriptions' ? 'Subscription Count' : 'Click Count',
        data: sortedHistory.map(item => 
          activeMetric === 'subscriptions' ? item.subscriptionCount : item.clickCount
        ),
        borderColor: activeMetric === 'subscriptions' ? 'rgb(53, 162, 235)' : 'rgb(255, 99, 132)',
        backgroundColor: activeMetric === 'subscriptions' ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      },
      {
        label: activeMetric === 'subscriptions' ? 'Subscription Growth' : 'Click Growth',
        data: sortedHistory.map(item => 
          activeMetric === 'subscriptions' ? item.subscriptionGrowth : item.clickGrowth
        ),
        borderColor: activeMetric === 'subscriptions' ? 'rgb(75, 192, 192)' : 'rgb(255, 159, 64)',
        backgroundColor: activeMetric === 'subscriptions' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 159, 64, 0.5)',
        borderDash: [5, 5],
        tension: 0.3,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Channel ${activeMetric === 'subscriptions' ? 'Subscription' : 'Click'} History (${activePeriod})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Channel History
        </h3>
        <div className="flex gap-2">
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
          <div className="flex rounded-md overflow-hidden">
            <button
              onClick={() => setActiveMetric('subscriptions')}
              className={`px-3 py-1 text-sm ${
                activeMetric === 'subscriptions'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveMetric('clicks')}
              className={`px-3 py-1 text-sm ${
                activeMetric === 'clicks'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Clicks
            </button>
          </div>
        </div>
      </div>

      {sortedHistory.length > 0 ? (
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
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