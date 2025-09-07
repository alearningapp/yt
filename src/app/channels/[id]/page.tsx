'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { getChannelById, trackChannelClick, updateChannel, deleteChannel } from '@/lib/actions/channels';
import { ChannelWithDetails } from '@/types';
import { ExternalLink, Users, Calendar, User, Edit, Trash2, ArrowLeft, Video, Eye, Save, X, Loader2 } from 'lucide-react';

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
    vid: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
            vid: data.vid || '',
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

    setIsUpdating(true);
    try {
      const result = await updateChannel(channelId, editData, channel.createdBy);
      if (result.success) {
        const updatedChannel = await getChannelById(channelId);
        setChannel(updatedChannel);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!channel || !confirm('Are you sure you want to delete this channel? This action cannot be undone.')) return;

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
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Channels
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.channelName}
                    onChange={(e) => setEditData(prev => ({ ...prev, channelName: e.target.value }))}
                    className="text-3xl font-bold text-gray-900 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Channel Name"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                    placeholder="Channel description"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {channel.channelName}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {channel.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwner && !isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    onClick={handleTrackClick}
                    disabled={isTrackingClick}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isTrackingClick ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {isTrackingClick ? 'Tracking...' : 'Track Click'}
                  </Button>
                </>
              )}
              
              {isEditing && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={isUpdating}
                    className="flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Channel Statistics
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Subscribers</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.subscriptionCount}
                        onChange={(e) => setEditData(prev => ({ ...prev, subscriptionCount: parseInt(e.target.value) || 0 }))}
                        className="text-lg font-semibold text-gray-900 w-32 p-2 border border-gray-300 rounded-md text-right"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatNumber(channel.subscriptionCount)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Clicks</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {channel.clickedBy.length}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Added on</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatDate(channel.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Added by</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {channel.createdByUser?.name || 'Unknown User'}
                    </span>
                  </div>
                </div>
              </div>

              {channel.vid && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-500" />
                    Video Information
                  </h3>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Video ID</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.vid}
                        onChange={(e) => setEditData(prev => ({ ...prev, vid: e.target.value }))}
                        className="text-lg font-semibold text-gray-900 w-48 p-2 border border-gray-300 rounded-md text-right"
                        placeholder="Enter video ID"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {channel.vid}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <a
                      href={`https://www.youtube.com/watch?v=${channel.vid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Watch on YouTube <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {channel.vid && (
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Video Preview</h3>
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden shadow-md">
                  <iframe
                    src={`https://www.youtube.com/embed/${channel.vid}`}
                    className="w-full h-72"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {channel.clickedBy.length > 0 && (
            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Users who clicked this channel ({channel.clickedBy.length})
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {channel.clickedBy.map((click, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {click.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(click.clickedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}