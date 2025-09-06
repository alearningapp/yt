'use server';

import { db } from '@/lib/db';
import { channels, channelClicks, user } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ChannelFormData, ChannelWithDetails } from '@/types';

export async function createChannel(data: ChannelFormData, userId: string) {
  try {
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
    return { success: false, error: 'Failed to create channel' };
  }
}

export async function getChannels(): Promise<ChannelWithDetails[]> {
  try {
    const channelsWithDetails = await db
      .select({
        id: channels.id,
        channelLink: channels.channelLink,
        channelName: channels.channelName,
        description: channels.description,
        subscriptionCount: channels.subscriptionCount,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        createdBy: channels.createdBy,
        createdByUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
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
              email: user.email,
              image: user.image,
              emailVerified: user.emailVerified,
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

export async function getChannelById(id: string): Promise<ChannelWithDetails | null> {
  try {
    const [channel] = await db
      .select({
        id: channels.id,
        channelLink: channels.channelLink,
        channelName: channels.channelName,
        description: channels.description,
        subscriptionCount: channels.subscriptionCount,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        createdBy: channels.createdBy,
        createdByUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
      .from(channels)
      .leftJoin(user, eq(channels.createdBy, user.id))
      .where(eq(channels.id, id));

    if (!channel) return null;

    const clicks = await db
      .select({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        clickedAt: channelClicks.clickedAt,
      })
      .from(channelClicks)
      .leftJoin(user, eq(channelClicks.userId, user.id))
      .where(eq(channelClicks.channelId, id));

    return {
      ...channel,
      clickCount: clicks.length,
      clickedBy: clicks,
    };
  } catch (error) {
    console.error('Error fetching channel:', error);
    return null;
  }
}

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

    return { success: true };
  } catch (error) {
    console.error('Error tracking click:', error);
    return { success: false, error: 'Failed to track click' };
  }
}
