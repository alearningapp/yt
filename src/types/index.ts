import { User, Channel, ChannelClick } from '@/lib/db/schema';

export interface ChannelWithDetails extends Channel {
  createdByUser: User | null;
  clickCount: number;
  clickedBy: Array<{
    user: User | null;
    clickedAt: Date;
  }>;
}

export interface ChannelFormData {
  channelLink: string;
  channelName: string;
  description: string;
  subscriptionCount: number;
  vid: string;
}

export interface UserSettings {
  name: string;
  email: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
