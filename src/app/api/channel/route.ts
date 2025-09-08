// app/api/youtube/channel/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  try {
    // You'll need to implement the actual YouTube API call here
    // This is a placeholder implementation
    const channelData = await fetchYouTubeChannelData(videoId);
    
    return NextResponse.json(channelData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch channel data' },
      { status: 500 }
    );
  }
}

async function fetchYouTubeChannelData(videoId: string) {
  // Implement actual YouTube Data API v3 call
  // You'll need a YouTube API key
  const API_KEY = process.env.YOUTUBE_API_KEY;
  // First get video details to get channel ID
  const videoResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
  );
  
  const videoData = await videoResponse.json();
  
  if (!videoData.items || videoData.items.length === 0) {
    throw new Error('Video not found');
  }
  
  const channelId = videoData.items[0].snippet.channelId;
  
  // Then get channel details
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
  );
  
  const channelData = await channelResponse.json();
  
  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found');
  }
  
  const channel = channelData.items[0];
  
  return {
    channelLink: `https://www.youtube.com/channel/${channelId}`,
    channelName: channel.snippet.title,
    description: channel.snippet.description,
    subscriptionCount: parseInt(channel.statistics.subscriberCount),
  };
}