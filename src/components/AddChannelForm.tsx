'use client';

import { useState } from 'react';
import { createChannel } from '@/lib/actions/channels';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ChannelFormData } from '@/types';

interface AddChannelFormProps {
  userId: string;
  onChannelAdded: () => void;
}

export function AddChannelForm({ userId, onChannelAdded }: AddChannelFormProps) {
  const [formData, setFormData] = useState<ChannelFormData>({
    channelLink: '',
    channelName: '',
    description: '',
    subscriptionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
        });
        setIsOpen(false);
        onChannelAdded();
      } else {
        setError(result.error || 'Failed to create channel');
      }
    } catch (err) {
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

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
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
          <Label htmlFor="channelLink">Channel Link</Label>
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

        <div className="flex space-x-2">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Adding...' : 'Add Channel'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
