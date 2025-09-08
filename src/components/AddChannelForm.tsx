'use client';

import { useState, useEffect } from 'react';
import { createChannel } from '@/lib/actions/channels';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ChannelFormData } from '@/types';
import { FaPlus, FaTimes, FaSpinner, FaSearch } from 'react-icons/fa';

interface AddChannelFormProps {
  userId: string;
  onChannelAdded: () => void;
}

interface YouTubeChannelData {
  channelLink: string;
  channelName: string;
  description: string;
  subscriptionCount: number;
}

export function AddChannelForm({ userId, onChannelAdded }: AddChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    channelLink: '',
    channelName: '',
    description: '',
    subscriptionCount: 0,
    vid: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);

  // Fetch channel data from YouTube API
  const fetchChannelData = async (videoId: string) => {
    setIsFetching(true);
    setError('');
    
    try {
      const response = await fetch(`/api/youtube/channel?videoId=${videoId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channel data');
      }
      
      // Update form data with fetched values
      setFormData(prev => ({
        ...prev,
        channelLink: data.channelLink,
        channelName: data.channelName,
        description: data.description,
        subscriptionCount: data.subscriptionCount,
      }));
      
      setShowFullForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channel data');
    } finally {
      setIsFetching(false);
    }
  };

  // Handle video ID input with debounce
  useEffect(() => {
    if (formData.vid.trim().length >= 11) { // YouTube video IDs are usually 11 characters
      const timer = setTimeout(() => {
        fetchChannelData(formData.vid);
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(timer);
    }
  }, [formData.vid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await createChannel(formData, userId);

      if (result.success) {
        setFormData({
          channelLink: '',
          channelName: '',
          description: '',
          subscriptionCount: 0,
          vid: '',
        });
        setShowFullForm(false);
        setIsOpen(false);
        onChannelAdded();
      } else {
        setError(result.error || 'Failed to create channel');
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'subscriptionCount' ? parseInt(value) || 0 : value,
    }));
  };

  const handleManualEdit = () => {
    setShowFullForm(true);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="mb-4 bg-blue-200">
        <FaPlus className="mr-2" />
        Add New Channel
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Channel</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="vid">YouTube Video ID</Label>
          <div className="relative">
            <Input
              id="vid"
              name="vid"
              type="text"
              value={formData.vid}
              onChange={handleChange}
              placeholder="Enter YouTube Video ID (e.g., dQw4w9WgXcQ)"
              required
              disabled={isFetching}
              className="pr-10"
            />
            {isFetching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaSpinner className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter any video ID from the channel you want to add
          </p>
        </div>

        {showFullForm && (
          <>
            <div>
              <Label htmlFor="channelLink">Channel @channelname</Label>
              <Input
                id="channelLink"
                name="channelLink"
                type="url"
                value={formData.channelLink}
                onChange={handleChange}
                placeholder="https://www.youtube.com/@channelname"
                required
              />
            </div>

            <div>
              <Label htmlFor="channelName">Channel Name</Label>
              <Input
                id="channelName"
                name="channelName"
                type="text"
                value={formData.channelName}
                onChange={handleChange}
                placeholder="Enter channel name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter channel description"
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label htmlFor="subscriptionCount">Current Subscriber Count</Label>
              <Input
                id="subscriptionCount"
                name="subscriptionCount"
                type="number"
                value={formData.subscriptionCount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </>
        )}

        <div className="flex space-x-2">
          {showFullForm ? (
            <>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus />
                    Add Channel
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setShowFullForm(false);
                }}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <FaTimes />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleManualEdit}
              className="flex-1 flex items-center justify-center gap-2"
              disabled={isFetching}
            >
              <FaSearch />
              {isFetching ? 'Fetching data...' : 'Edit manually'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}