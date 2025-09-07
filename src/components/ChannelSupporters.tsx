'use client';

import { User, Calendar, Eye, ExternalLink } from 'lucide-react';
import { getChannelSupporters } from '@/lib/actions/channels';
import { useEffect, useState } from 'react';

interface Channel {
  id: string;
  vid: string;
  channelLink: string;
  channelName: string;
}

interface Supporter {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
    emailVerified?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  clickedAt: Date;
  channels: Channel[];
}

interface ChannelSupportersProps {
  channelId: string;
}

export function ChannelSupporters({ channelId }: ChannelSupportersProps) {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
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
        <div className="grid grid-cols-1 gap-4">
          {supporters.map((supporter, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
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

              { supporter.channels.length > 0 && (
                <div className="mt-4 pl-13">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Their channels:</h4>
                  <div className="space-y-2">
                    {supporter.channels.map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{channel.channelName}</p>
                          <p className="text-xs text-gray-500">{channel.vid}</p>
                        </div>
                        <a
                          href={channel.channelLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 ml-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}