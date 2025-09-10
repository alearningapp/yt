'use client';

import Link from 'next/link';
import { ChannelWithDetails } from '@/types';
import { ExternalLink, Users, Calendar, User } from 'lucide-react';

interface ChannelCardProps {
  channel: ChannelWithDetails;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {channel.channelName}
          </h3>
          <p className="text-gray-600 mb-3 line-clamp-2">
            {channel.channelAlias}
          </p>
          <p className="text-gray-600 mb-3 line-clamp-2">
            {channel.description}
          </p>
        </div>
        <Link
          href={channel.channelAlias?`https://www.youtube.com/`+ channel.channelAlias:channel.channelLink }
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{formatNumber(channel.subscriptionCount)} subscribers</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span> {formatDate(channel.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          <span>by {channel.createdByUser?.name || 'Unknown User'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <span>{channel.clickCount} clicks</span>
        </div>
        <Link
          href={`/channels/${channel.channelAlias||channel.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
