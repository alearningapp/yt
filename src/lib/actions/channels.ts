'use server';

import { db } from '@/lib/db';
import { channels, channelClicks, user, channelHistory } from '@/lib/db/schema';
import { eq, desc, and, inArray, or } from 'drizzle-orm';
import { ChannelFormData, ChannelWithDetails, ChannelWithHistoryDetails } from '@/types';

export async function createChannel(data: ChannelFormData, userId: string) {
  try {
    // Check if channel with the same channelLink already exists
    const existingChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.channelLink, data.channelLink))
      .limit(1);

    if (existingChannel.length > 0) {
      return { 
        success: false, 
        error: 'Channel with this link already exists' 
      };
    }

    const [channel] = await db
      .insert(channels)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return { success: true, channel };
  } catch (error) {
    console.error('Error creating channel:', error);
    
    // Handle unique constraint violation error (as a fallback)
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string' &&
      (
        ((error as { message: string }).message.includes('unique')) ||
        ((error as { message: string }).message.includes('duplicate'))
      )
    ) {
      return { 
        success: false, 
        error: 'Channel with this link already exists' 
      };
    }
    
    return { success: false, error: 'Failed to create channel' };
  }
}

export async function getChannels(): Promise<ChannelWithDetails[]> {
  try {
    const channelsWithDetails = await db
      .select({
        id: channels.id,
        vid:channels.vid,
        channelLink: channels.channelLink,
        channelName: channels.channelName,
        channelAlias: channels.channelAlias,
        ytChannelId: channels.ytChannelId,
        description: channels.description,
        subscriptionCount: channels.subscriptionCount,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        createdBy: channels.createdBy,
        createdByUser: {
          id: user.id,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
      .from(channels)
      .leftJoin(user, eq(channels.createdBy, user.id))
      .orderBy(desc(channels.createdAt));

    // Get click counts and clicked user for each channel
    const channelsWithClicks = await Promise.all(
      channelsWithDetails.map(async (channel) => {
        const clicks = await db
          .select({
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            clickedAt: channelClicks.clickedAt,
          })
          .from(channelClicks)
          .leftJoin(user, eq(channelClicks.userId, user.id))
          .where(eq(channelClicks.channelId, channel.id));

        return {
          ...channel,
          clickCount: clicks.length,
          clickedBy: clicks,
        };
      })
    );
    return channelsWithClicks;
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
}
function isValidUUID(uuid:string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Usage

async function getChannelByIdName(id: string)  {
if(isValidUUID(id)){

 return await db
      .select({
        id: channels.id,
        vid:channels.vid,
        channelLink: channels.channelLink,
        channelName: channels.channelName,
        channelAlias: channels.channelAlias,
        ytChannelId: channels.ytChannelId,
        description: channels.description,
        subscriptionCount: channels.subscriptionCount,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        createdBy: channels.createdBy,
        createdByUser: {
          id: user.id,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
      .from(channels)
      .leftJoin(user, eq(channels.createdBy, user.id))
      .where(eq(channels.id, id));
}

 return await db
      .select({
        id: channels.id,
        vid:channels.vid,
        channelLink: channels.channelLink,
        channelName: channels.channelName,
        channelAlias: channels.channelAlias,
        ytChannelId: channels.ytChannelId,
        description: channels.description,
        subscriptionCount: channels.subscriptionCount,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        createdBy: channels.createdBy,
        createdByUser: {
          id: user.id,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
      .from(channels)
      .leftJoin(user, eq(channels.createdBy, user.id))
      .where(or(eq(channels.ytChannelId,id),eq(channels.channelAlias,id)));
  
}

export async function getChannelById(id: string, includeHistory = false): Promise<ChannelWithHistoryDetails | null> {
  try {
    const [channel] = await getChannelByIdName(id);

    if (!channel) return null;

    const clicks = await db
      .select({
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        clickedAt: channelClicks.clickedAt,
      })
      .from(channelClicks)
      .leftJoin(user, eq(channelClicks.userId, user.id))
      .where(eq(channelClicks.channelId, channel.id));

    const channelData = {
      ...channel,
      ytChannelId: channel.ytChannelId,
      clickCount: clicks.length,
      clickedBy: clicks,
    };

    // Include history data if requested
    if (includeHistory) {
      // Get weekly and monthly history
      const weeklyHistory = await db
        .select()
        .from(channelHistory)
        .where(
          and(
            eq(channelHistory.channelId, channel.id),
            eq(channelHistory.period, 'weekly')
          )
        )
        .orderBy(desc(channelHistory.startDate))
        .limit(12);

      const monthlyHistory = await db
        .select()
        .from(channelHistory)
        .where(
          and(
            eq(channelHistory.channelId, channel.id),
            eq(channelHistory.period, 'monthly')
          )
        )
        .orderBy(desc(channelHistory.startDate))
        .limit(12);

      return {
        ...channelData,
        history: [...weeklyHistory, ...monthlyHistory],
      };
    }

    return channelData;
  } catch (error) {
    console.error('Error fetching channel:', error);
    return null;
  }
}
export async function getChannelSupporters(channelId: string) {
  // First, get all clicks with user data
  const clicks = await db
    .select({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      clickedAt: channelClicks.clickedAt,
    })
    .from(channelClicks)
    .leftJoin(user, eq(channelClicks.userId, user.id))
    .where(eq(channelClicks.channelId, channelId));

  // Get all user IDs for batch querying
  const userIds = clicks.map(click => click.user?.id).filter(Boolean) as string[];

  if (userIds.length === 0) {
    return [];
  }

  // Get channels for all users in a single query (more efficient)
  const userChannels = await db
    .select({
      id: channels.id,
      vid: channels.vid,
      channelLink: channels.channelLink,
      channelName: channels.channelName,
      createdBy: channels.createdBy
    })
    .from(channels)
    .where(inArray(channels.createdBy, userIds))
    .orderBy(desc(channels.createdAt));

  // Group channels by user ID for easy lookup
  const channelsByUser = userChannels.reduce((acc, channel) => {
    const userId = channel.createdBy;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(channel);
    return acc;
  }, {} as Record<string, typeof userChannels>);

  // Combine the data
  const clickAndChannels = clicks.map(click => {
    const userChannels = click.user?.id ? channelsByUser[click.user.id] || [] : [];
    return {
      ...click,
      channels: userChannels
    };
  });

  return clickAndChannels;
}
// Import the functions from channelHistory.ts
import { generateAndSaveWeeklyStats, generateAndSaveMonthlyStats } from './channelHistory';

export async function updateChannel(id: string, data: Partial<ChannelFormData>, userId: string) {
  try {
    // Check if user owns the channel
    const [channel] = await db
      .select()
      .from(channels)
      .where(and(eq(channels.id, id), eq(channels.createdBy, userId)));

    if (!channel) {
      return { success: false, error: 'Channel not found or unauthorized' };
    }

    const [updatedChannel] = await db
      .update(channels)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, id))
      .returning();

    // Generate and save weekly and monthly statistics
    await generateAndSaveWeeklyStats(id);
    await generateAndSaveMonthlyStats(id);

    return { success: true, channel: updatedChannel };
  } catch (error) {
    console.error('Error updating channel:', error);
    return { success: false, error: 'Failed to update channel' };
  }
}

export async function deleteChannel(id: string, userId: string) {
  try {
    // Check if user owns the channel
    const [channel] = await db
      .select()
      .from(channels)
      .where(and(eq(channels.id, id), eq(channels.createdBy, userId)));

    if (!channel) {
      return { success: false, error: 'Channel not found or unauthorized' };
    }

    await db.delete(channels).where(eq(channels.id, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting channel:', error);
    return { success: false, error: 'Failed to delete channel' };
  }
}

export async function trackChannelClick(channelId: string, userId: string) {
  try {
    // Check if user already clicked this channel
    const existingClick = await db
      .select()
      .from(channelClicks)
      .where(and(eq(channelClicks.channelId, channelId), eq(channelClicks.userId, userId)));

    if (existingClick.length > 0) {
      return { success: false, error: 'Already clicked this channel' };
    }

    await db.insert(channelClicks).values({
      channelId,
      userId,
    });

    // Generate and save weekly and monthly statistics after a new click
    await generateAndSaveWeeklyStats(channelId);
    await generateAndSaveMonthlyStats(channelId);

    return { success: true };
  } catch (error) {
    console.error('Error tracking click:', error);
    return { success: false, error: 'Failed to track click' };
  }
}
