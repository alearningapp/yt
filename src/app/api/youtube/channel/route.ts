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
    const channelData = await fetchYouTubeChannelData(videoId);
    
    return NextResponse.json(channelData);
  } catch (error) {
    console.error('Error fetching channel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel data' },
      { status: 500 }
    );
  }
}

async function fetchYouTubeChannelData(videoId: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  // First get video details to get channel ID
  const videoResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
  );
  
  const videoData = await videoResponse.json();
  
  if (!videoData.items || videoData.items.length === 0) {
    throw new Error('Video not found');
  }
  
  const channelId = videoData.items[0].snippet.channelId;
  const channelTitle = videoData.items[0].snippet.channelTitle;
  
  // Get channel details including custom URL
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`
  );
  
  const channelData = await channelResponse.json();
  
  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found');
  }
  
  const channel = channelData.items[0];
  
  // Determine the best channel link to use
  let channelLink = `https://www.youtube.com/channel/${channelId}`; // fallback
  
  // Check for custom URL in brandingSettings
  if (channel.brandingSettings?.channel?.customUrl) {
    const customUrl = channel.brandingSettings.channel.customUrl;
    channelLink = `https://www.youtube.com/${customUrl}`;
  }
  // Alternatively, you can construct from channel title (less reliable)
  else if (channelTitle) {
    // Convert to handle format (remove spaces, special chars, etc.)
    const handle = channelTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
    
    if (handle) {
      channelLink = `https://www.youtube.com/@${handle}`;
    }
  }
  
  return {
    channelLink,
    channelId,
    channelName: channel.snippet.title,
    description: channel.snippet.description,
    subscriptionCount: parseInt(channel.statistics.subscriberCount),
    customUrl: channel.brandingSettings?.channel?.customUrl || null,
    thumbnail: channel.snippet.thumbnails?.default?.url || null
  };
}