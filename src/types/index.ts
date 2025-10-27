import { Channel, ChannelHistory, user, Article } from '@/lib/db/schema';

export interface UserBasicInfo {
  id: string;
  name: string | null;
  email?: string;  // Made email optional
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelWithDetails extends Channel {
  createdByUser: UserBasicInfo | null;
  clickCount: number;
  clickedBy: Array<{
    user: UserBasicInfo | null;
    clickedAt: Date;
  }>;
}

export interface ChannelFormData {
  channelLink: string;
  channelName: string;
  channelAlias: string;
  ytChannelId: string;
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

// Article types
export interface ArticleFormData {
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
}

export interface ArticleWithDetails extends Article {
  user?: UserBasicInfo | null;
  likeCount: number;
  viewCount: number;
  isLiked?: boolean;
}

export interface ArticleListResponse {
  articles: ArticleWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Audio recording types
export interface AudioSegmentData {
  segmentIndex: number;
  startWord: number;
  endWord: number;
  audioUrl: string;
  duration: number;
  fileSize: number;
}

export interface ArticleAudioData {
  articleId: string;
  userId: string;
  audioUrl?: string;
  status: 'draft' | 'published';
  duration?: number;
  fileSize?: number;
  segments: AudioSegmentData[];
}

export interface RecordingSession {
  currentSegment: number;
  segments: Map<number, Blob>;
  isRecording: boolean;
  isPlaying: boolean;
  speed: number; // words per minute
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSegment: number;
}
