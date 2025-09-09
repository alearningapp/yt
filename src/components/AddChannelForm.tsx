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

interface ValidationErrors {
  vid?: string;
  channelLink?: string;
  channelName?: string;
  description?: string;
  subscriptionCount?: string;
  channelAlias?: string;
}

export function AddChannelForm({ userId, onChannelAdded }: AddChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    channelLink: '',
    channelName: '',
    channelAlias: '',
    description: '',
    subscriptionCount: 0,
    vid: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // YouTube video ID validation regex
  const isValidYouTubeVideoId = (id: string): boolean => {
    const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
    return youtubeRegex.test(id);
  };

  // YouTube channel link validation
  const isValidYouTubeChannelLink = (link: string): boolean => {
    const channelRegex = /^(https?:\/\/)?(www\.)?youtube\.com\/(@[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+|channel\/[a-zA-Z0-9_-]+)/i;
    return channelRegex.test(link);
  };

  // Extract video ID from various YouTube URL formats
  const extractVideoId = (input: string): string | null => {
    // Handle direct video ID
    if (isValidYouTubeVideoId(input)) {
      return input;
    }
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate video input (could be ID or URL)
    if (!formData.vid.trim()) {
      errors.vid = 'Video ID or URL is required';
    } else {
      const videoId = extractVideoId(formData.vid);
      if (!videoId) {
        errors.vid = 'Please enter a valid YouTube Video ID or URL';
      }
    }

    if (showFullForm) {
      // Validate channel link
      if (!formData.channelLink.trim()) {
        errors.channelLink = 'Channel link is required';
      } else if (!isValidYouTubeChannelLink(formData.channelLink)) {
        errors.channelLink = 'Please enter a valid YouTube channel link';
      }

      // Validate channel name
      if (!formData.channelName.trim()) {
        errors.channelName = 'Channel name is required';
      } else if (formData.channelName.length < 2) {
        errors.channelName = 'Channel name must be at least 2 characters long';
      } else if (formData.channelName.length > 100) {
        errors.channelName = 'Channel name must be less than 100 characters';
      }

      // Validate description
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description.length < 10) {
        errors.description = 'Description must be at least 10 characters long';
      } else if (formData.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
      }

      // Validate subscription count
      if (formData.subscriptionCount < 0) {
        errors.subscriptionCount = 'Subscriber count cannot be negative';
      } else if (formData.subscriptionCount > 1000000000) {
        errors.subscriptionCount = 'Please enter a valid subscriber count';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation errors when form data changes
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
  }, [formData]);

  // Fetch channel data from YouTube API
  const fetchChannelData = async (input: string) => {
    const videoId = extractVideoId(input);
    
    if (!videoId) {
      setValidationErrors({ vid: 'Please enter a valid YouTube Video ID or URL' });
      return;
    }

    setIsFetching(true);
    setError('');
    setValidationErrors({});
    
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
        channelAlias: data.channelAlias,
      }));
      
      setShowFullForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channel data');
    } finally {
      setIsFetching(false);
    }
  };

  // Handle video ID/URL input with debounce
  useEffect(() => {
    const input = formData.vid.trim();
    
    if (input) {
      const videoId = extractVideoId(input);
      
      if (videoId && isValidYouTubeVideoId(videoId)) {
        const timer = setTimeout(() => {
          fetchChannelData(input);
        }, 1000); // 1 second debounce
        
        return () => clearTimeout(timer);
      }
    }
  }, [formData.vid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await createChannel(formData, userId);

      if (result.success) {
        setFormData({
          channelLink: '',
          channelName: '',
          channelAlias: '',
          description: '',
          subscriptionCount: 0,
          vid: '',
        });
        setShowFullForm(false);
        setIsOpen(false);
        setValidationErrors({});
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

  const handleCancel = () => {
    setIsOpen(false);
    setShowFullForm(false);
    setFormData({
      channelLink: '',
      channelName: '',
      channelAlias: '',
      description: '',
      subscriptionCount: 0,
      vid: '',
    });
    setValidationErrors({});
    setError('');
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
          <Label htmlFor="vid">YouTube Video ID or URL</Label>
          <div className="relative">
            <Input
              id="vid"
              name="vid"
              type="text"
              value={formData.vid}
              onChange={handleChange}
              placeholder="Enter YouTube Video ID or URL (e.g., dQw4w9WgXcQ or https://youtube.com/watch?v=dQw4w9WgXcQ)"
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
          {validationErrors.vid && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.vid}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Enter any video ID or URL from the channel you want to add
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
              {validationErrors.channelLink && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.channelLink}</p>
              )}
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
                maxLength={100}
              />
              {validationErrors.channelName && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.channelName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="channelAlias">channel Alias@</Label>
              <Input
                id="channelAlias"
                name="channelAlias"
                type="text"
                value={formData.channelAlias}
                onChange={handleChange}
                placeholder="Enter channel name"
                required
                maxLength={100}
              />
              {validationErrors.channelAlias && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.channelAlias}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter channel description"
                maxLength={500}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
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
                max="1000000000"
                required
              />
              {validationErrors.subscriptionCount && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.subscriptionCount}</p>
              )}
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
                onClick={handleCancel}
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