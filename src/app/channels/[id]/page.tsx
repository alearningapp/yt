'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { getChannelById, trackChannelClick, updateChannel, deleteChannel } from '@/lib/actions/channels';
import { ChannelWithHistoryDetails } from '@/types';
import { ExternalLink, Users, Edit, Trash2, ArrowLeft, Video, Eye, Save, X, Loader2, ThumbsUp, MessageSquare, BarChart } from 'lucide-react';
import { ChannelSupporters } from '@/components/ChannelSupporters';
import { ChannelHistory } from '@/components/ChannelHistory';
import { GenerateStatsButton } from '@/components/GenerateStatsButton';
export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [channel, setChannel] = useState<ChannelWithHistoryDetails | null>(null);
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
  const [videoInfo, setVideoInfo] = useState<{
    title?: string;
    author_name?: string;
    author_url?: string;
    provider_name?: string;
    thumbnail_url?: string;
  } | null>(null);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);

  const channelId = params.id as string;

  // Function to extract video ID from URL
  function extractVideoId(url: string) {
    if (!url) return null;
    
    // If it's already a video ID format (no special characters except maybe underscores)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    if (!url.includes('youtube') && !url.includes('youtu.be')) {
      return null;
    }
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/v\/)([^?]+)/,
      /(?:youtube\.com\/watch\?.*v=)([^&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  // Fetch video info using oEmbed API
  const fetchVideoInfo = async (videoId: string) => {
    if (!videoId) return;
    
    setIsFetchingVideo(true);
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Video not found or unavailable');
      }
      
      const data = await response.json();
      setVideoInfo(data);
      return data;
    } catch (error) {
      console.error('Error fetching video info:', error);
      setVideoInfo(null);
      return null;
    } finally {
      setIsFetchingVideo(false);
    }
  };

  // Function to update channel name based on video author
  const updateChannelNameFromVideo = async (videoId: string) => {
    if (!videoId) return;
    
    try {
      const videoData = await fetchVideoInfo(videoId);
      if (videoData && videoData.author_name) {
        // Update the editData with the channel name from video author
        setEditData(prev => ({
          ...prev,
          channelName: videoData.author_name
        }));
      }
    } catch (error) {
      console.error('Error updating channel name from video:', error);
    }
  };

  // Handle video ID change
  const handleVideoIdChange = async (newVideoId: string) => {
    setEditData(prev => ({ ...prev, vid: newVideoId }));
    
    // Extract the actual video ID from the input
    const extractedId = extractVideoId(newVideoId);
    
    if (extractedId) {
      // Update channel name based on the video author
      await updateChannelNameFromVideo(extractedId);
      
      // Also fetch video info for display
      fetchVideoInfo(extractedId);
    } else {
      setVideoInfo(null);
    }
  };

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        // Include history data when fetching channel
        const data = await getChannelById(channelId, true);
        setChannel(data);
        if (data) {
          setEditData({
            channelName: data.channelName,
            description: data.description,
            subscriptionCount: data.subscriptionCount,
            vid: data.vid || '',
          });
          
          // Fetch video info if there's a video ID
          if (data.vid) {
            const extractedId = extractVideoId(data.vid);
            if (extractedId) {
              fetchVideoInfo(extractedId);
            }
          }
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
        
        // Refetch video info if video ID was changed
        if (editData.vid !== channel.vid) {
          const extractedId = extractVideoId(editData.vid);
          if (extractedId) {
            fetchVideoInfo(extractedId);
          } else {
            setVideoInfo(null);
          }
        }
        
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
  const videoId = extractVideoId(channel.vid || '');

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
                  <div>
                    <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-1">
                      Channel Name
                    </label>
                    <input
                      id="channelName"
                      type="text"
                      value={editData.channelName}
                      onChange={(e) => setEditData(prev => ({ ...prev, channelName: e.target.value }))}
                      className="text-3xl font-bold text-gray-900 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Channel Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                      placeholder="Channel description"
                    />
                  </div>
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
                </>
              )}
              
              {!isEditing && (
                <Button
                  onClick={handleTrackClick}
                  disabled={isTrackingClick}
                  className="flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  {isTrackingClick ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {isTrackingClick ? 'Support...' : 'Support This Channel'}
                </Button>
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
                    onClick={() => {
                      setIsEditing(false);
                      // Reset edit data to original values
                      setEditData({
                        channelName: channel.channelName,
                        description: channel.description,
                        subscriptionCount: channel.subscriptionCount,
                        vid: channel.vid || '',
                      });
                    }}
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Channel Statistics
                  </h3>
                  {isOwner && !isEditing && (
                    <GenerateStatsButton 
                      channelId={channel.id} 
                      onSuccess={() => {
                        // Refresh channel data after generating stats
                        getChannelById(channelId, true).then(data => {
                          if (data) setChannel(data);
                        });
                      }} 
                    />
                  )}
                </div>
                
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
                    <span className="text-gray-600">Total Supports</span>
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

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-500" />
                  Video Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Video ID/URL</span>
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-2">
                        <input
                          type="text"
                          value={editData.vid}
                          onChange={(e) => handleVideoIdChange(e.target.value)}
                          className="text-lg font-semibold text-gray-900 w-64 p-2 border border-gray-300 rounded-md text-right"
                          placeholder="Enter video ID or URL"
                        />
                        <span className="text-xs text-gray-500">
                          Enter a YouTube URL or video ID to auto-update channel name
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {videoId || 'Not specified'}
                      </span>
                    )}
                  </div>
                  
                  {videoInfo && !isEditing && (
                    <div className="mt-4 space-y-3 p-3 bg-white rounded-md border border-gray-200">
                      <h4 className="font-medium text-gray-800">{videoInfo.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" /> 
                          {videoInfo.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {videoInfo.provider_name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isFetchingVideo && (
                    <div className="mt-4 flex justify-center items-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-600">Loading video info...</span>
                    </div>
                  )}
                  
                  {videoId && (
                    <div className="mt-4">
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Watch on YouTube <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {videoId && (
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {videoInfo ? videoInfo.title : 'Video Preview'}
                </h3>
                
                {isFetchingVideo ? (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden shadow-md">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-72"
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                
                {videoInfo && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>By {videoInfo.author_name}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Channel History Section */}
          {channel.history && channel.history.length > 0 && (
            <div className="mt-8 mb-8">
              <ChannelHistory channelHistory={channel.history} />
            </div>
          )}
          
          <ChannelSupporters channelId={channel.id} />
        </div>
      </main>
    </div>
  );
}