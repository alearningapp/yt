'use client';

import { User, Calendar } from 'lucide-react';
import { Eye } from 'lucide-react';
import { getChannelSupporters } from '@/lib/actions/channels';
import { useEffect, useState } from 'react';

interface Supporter {
  user?: {
    name: string;
  };
  clickedAt: Date;
}

interface ChannelSupportersProps {
  channelId: string;
}

export function ChannelSupporters({ channelId }: ChannelSupportersProps) {

  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  useEffect(() => {
    const fetchSupporters = async () => {
      const list = await getChannelSupporters(channelId);
      setSupporters(list);
    };
    fetchSupporters();
  }, [channelId]);

  if (supporters.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Eye className="w-5 h-5 text-indigo-500" />
        Users who support this channel ({supporters.length})
      </h3>
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supporters.map((supporter, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {supporter.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(supporter.clickedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}