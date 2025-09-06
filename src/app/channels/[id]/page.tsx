'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { getChannelById, trackChannelClick, updateChannel, deleteChannel } from '@/lib/actions/channels';
import { ChannelWithDetails } from '@/types';
import { ExternalLink, Users, Calendar, User, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, authClient } = useAuth();
  const [channel, setChannel] = useState<ChannelWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackingClick, setIsTrackingClick] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    channelName: '',
    description: '',
    subscriptionCount: 0,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const channelId = params.id as string;

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const data = await getChannelById(channelId);
        setChannel(data);
        if (data) {
          setEditData({
            channelName: data.channelName,
            description: data.description,
            subscriptionCount: data.subscriptionCount,
          });
        }
      } catch (error) {
        console.error('Error fetching channel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannel();
  }, [channelId]);

  const handleTrackClick = async () => {
    if (!session || !channel) return;

    setIsTrackingClick(true);
    try {
      const result = await trackChannelClick(channelId, session.user?.id || '');
      if (result.success) {
        // Refresh channel data to show updated click count
        const updatedChannel = await getChannelById(channelId);
        setChannel(updatedChannel);
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    } finally {
      setIsTrackingClick(false);
    }
  };

  const handleUpdate = async () => {
    if (!channel) return;

    try {
      const result = await updateChannel(channelId, editData, channel.createdBy);
      if (result.success) {
        setChannel(result.channel as ChannelWithDetails);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  };

  const handleDelete = async () => {
    if (!channel || !confirm('Are you sure you want to delete this channel?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteChannel(channelId, channel.createdBy);
      if (result.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Channel not found</h1>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === channel.createdBy;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Channels
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.channelName}
                  onChange={(e) => setEditData(prev => ({ ...prev, channelName: e.target.value }))}
                  className="text-3xl font-bold text-gray-900 mb-2 w-full p-2 border rounded"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {channel.channelName}
                </h1>
              )}
              
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-gray-600 mb-4 w-full p-2 border rounded h-24"
                />
              ) : (
                <p className="text-gray-600 mb-4">
                  {channel.description}
                </p>
              )}
            </div>

            <div className="flex space-x-2 ml-4">
              {isOwner && !isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
              
              {isEditing && (
                <>
                  <Button onClick={handleUpdate} className="flex items-center">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Subscribers</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.subscriptionCount}
                      onChange={(e) => setEditData(prev => ({ ...prev, subscriptionCount: parseInt(e.target.value) || 0 }))}
                      className="text-lg font-semibold text-gray-900 w-full p-1 border rounded"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(channel.subscriptionCount)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Added on</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(channel.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Added by</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {channel.createdByUser?.name || 'Unknown User'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Total Clicks</p>
                <p className="text-3xl font-bold text-blue-600">
                  {channel.clickCount}
                </p>
              </div>

              <Button
                onClick={handleTrackClick}
                disabled={isTrackingClick || !session}
                className="w-full flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isTrackingClick ? 'Opening...' : 'Visit Channel'}
              </Button>
            </div>
          </div>

          {channel.clickedBy.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Users who clicked this channel ({channel.clickedBy.length})
              </h3>
              <div className="space-y-2">
                {channel.clickedBy.map((click, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {click.user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(click.clickedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
