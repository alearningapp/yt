import { Channel, ChannelHistory } from '@/lib/db/schema';

export interface ChannelWithDetails extends Channel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdByUser: any | null;
  clickCount: number;
  clickedBy: Array<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any | null;
    clickedAt: Date;
  }>;
}

export interface ChannelFormData {
  channelLink: string;
  channelName: string;
  channelAlias: string;
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

export interface ChannelHistoryWithDetails extends ChannelHistory {
  channel?: Channel;
}

export interface ChannelStatsPeriod {
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  subscriptionCount: number;
  clickCount: number;
  subscriptionGrowth: number;
  clickGrowth: number;
}

export interface ChannelWithHistoryDetails extends ChannelWithDetails {
  history?: ChannelHistoryWithDetails[];
}
