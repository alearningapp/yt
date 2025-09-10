'use server';

import { db } from '@/lib/db';
import { channels, channelClicks, channelHistory } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { ChannelHistoryWithDetails, ChannelStatsPeriod } from '@/types';

/**
 * Generate weekly statistics for a channel
 * @param channelId The ID of the channel
 * @param date The date to generate statistics for (defaults to current date)
 */
export async function generateWeeklyStats(channelId: string, date: Date = new Date()): Promise<ChannelStatsPeriod | null> {
  try {
    // Calculate the start and end of the week
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
    endDate.setHours(23, 59, 59, 999);

    // Get the channel data
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return null;
    }

    // Count clicks within the period
    const clicks = await db
      .select()
      .from(channelClicks)
      .where(
        and(
          eq(channelClicks.channelId, channelId),
          gte(channelClicks.clickedAt, startDate),
          lte(channelClicks.clickedAt, endDate)
        )
      );

    const clickCount = clicks.length;

    // Get previous period stats to calculate growth
    const previousPeriodStartDate = new Date(startDate);
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 7);
    
    const previousPeriodEndDate = new Date(endDate);
    previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 7);

    // Get previous period stats from history table
    const [previousPeriodStats] = await db
      .select()
      .from(channelHistory)
      .where(
        and(
          eq(channelHistory.channelId, channelId),
          eq(channelHistory.period, 'weekly'),
          eq(channelHistory.startDate, previousPeriodStartDate)
        )
      );

    // If no previous stats, assume growth is current value
    const previousSubscriptionCount = previousPeriodStats?.subscriptionCount || 0;
    const previousClickCount = previousPeriodStats?.clickCount || 0;

    const subscriptionGrowth = channel.subscriptionCount - previousSubscriptionCount;
    const clickGrowth = clickCount - previousClickCount;

    const stats: ChannelStatsPeriod = {
      period: 'weekly',
      startDate,
      endDate,
      subscriptionCount: channel.subscriptionCount,
      clickCount,
      subscriptionGrowth,
      clickGrowth
    };

    return stats;
  } catch (error) {
    console.error('Error generating weekly stats:', error);
    return null;
  }
}

/**
 * Generate monthly statistics for a channel
 * @param channelId The ID of the channel
 * @param date The date to generate statistics for (defaults to current date)
 */
export async function generateMonthlyStats(channelId: string, date: Date = new Date()): Promise<ChannelStatsPeriod | null> {
  try {
    // Calculate the start and end of the month
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get the channel data
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return null;
    }

    // Count clicks within the period
    const clicks = await db
      .select()
      .from(channelClicks)
      .where(
        and(
          eq(channelClicks.channelId, channelId),
          gte(channelClicks.clickedAt, startDate),
          lte(channelClicks.clickedAt, endDate)
        )
      );

    const clickCount = clicks.length;

    // Get previous period stats to calculate growth
    const previousPeriodStartDate = new Date(startDate);
    previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 1);
    
    const previousPeriodEndDate = new Date(endDate);
    previousPeriodEndDate.setMonth(previousPeriodEndDate.getMonth() - 1);

    // Get previous period stats from history table
    const [previousPeriodStats] = await db
      .select()
      .from(channelHistory)
      .where(
        and(
          eq(channelHistory.channelId, channelId),
          eq(channelHistory.period, 'monthly'),
          eq(channelHistory.startDate, previousPeriodStartDate)
        )
      );

    // If no previous stats, assume growth is current value
    const previousSubscriptionCount = previousPeriodStats?.subscriptionCount || 0;
    const previousClickCount = previousPeriodStats?.clickCount || 0;

    const subscriptionGrowth = channel.subscriptionCount - previousSubscriptionCount;
    const clickGrowth = clickCount - previousClickCount;

    const stats: ChannelStatsPeriod = {
      period: 'monthly',
      startDate,
      endDate,
      subscriptionCount: channel.subscriptionCount,
      clickCount,
      subscriptionGrowth,
      clickGrowth
    };

    return stats;
  } catch (error) {
    console.error('Error generating monthly stats:', error);
    return null;
  }
}

/**
 * Save channel statistics to the history table
 * @param channelId The ID of the channel
 * @param stats The statistics to save
 */
export async function saveChannelStats(channelId: string, stats: ChannelStatsPeriod) {
  try {
    // Check if stats for this period already exist
    const existingStats = await db
      .select()
      .from(channelHistory)
      .where(
        and(
          eq(channelHistory.channelId, channelId),
          eq(channelHistory.period, stats.period),
          eq(channelHistory.startDate, stats.startDate)
        )
      );

    if (existingStats.length > 0) {
      // Update existing stats
      await db
        .update(channelHistory)
        .set({
          subscriptionCount: stats.subscriptionCount,
          clickCount: stats.clickCount,
          subscriptionGrowth: stats.subscriptionGrowth,
          clickGrowth: stats.clickGrowth,
        })
        .where(eq(channelHistory.id, existingStats[0].id));
      
      return { success: true, updated: true };
    } else {
      // Insert new stats
      await db
        .insert(channelHistory)
        .values({
          channelId,
          period: stats.period,
          startDate: stats.startDate,
          endDate: stats.endDate,
          subscriptionCount: stats.subscriptionCount,
          clickCount: stats.clickCount,
          subscriptionGrowth: stats.subscriptionGrowth,
          clickGrowth: stats.clickGrowth,
        });
      
      return { success: true, updated: false };
    }
  } catch (error) {
    console.error('Error saving channel stats:', error);
    return { success: false, error: 'Failed to save channel stats' };
  }
}

/**
 * Generate and save weekly statistics for a channel
 * @param channelId The ID of the channel
 */
export async function generateAndSaveWeeklyStats(channelId?: string) {
  // If no channelId provided, generate for all channels
  if (!channelId) {
    const allChannels = await db.select().from(channels);
    await Promise.all(allChannels.map(channel => 
      generateAndSaveWeeklyStats(channel.id)
    ));
    return { success: true };
  }
  try {
    const stats = await generateWeeklyStats(channelId);
    if (!stats) {
      return { success: false, error: 'Failed to generate weekly stats' };
    }

    return await saveChannelStats(channelId, stats);
  } catch (error) {
    console.error('Error generating and saving weekly stats:', error);
    return { success: false, error: 'Failed to generate and save weekly stats' };
  }
}

/**
 * Generate and save monthly statistics for a channel
 * @param channelId The ID of the channel
 */
export async function generateAndSaveMonthlyStats(channelId?: string) {
  // If no channelId provided, generate for all channels
  if (!channelId) {
    const allChannels = await db.select().from(channels);
    await Promise.all(allChannels.map(channel => 
      generateAndSaveMonthlyStats(channel.id)
    ));
    return { success: true };
  }
  try {
    const stats = await generateMonthlyStats(channelId);
    if (!stats) {
      return { success: false, error: 'Failed to generate monthly stats' };
    }

    return await saveChannelStats(channelId, stats);
  } catch (error) {
    console.error('Error generating and saving monthly stats:', error);
    return { success: false, error: 'Failed to generate and save monthly stats' };
  }
}

/**
 * Get channel history for a specific period
 * @param channelId The ID of the channel
 * @param period The period to get history for ('weekly' or 'monthly')
 * @param limit The maximum number of records to return
 */
export async function getChannelHistory(
  channelId: string, 
  period: 'weekly' | 'monthly', 
  limit = 12
): Promise<ChannelHistoryWithDetails[]> {
  try {
    const history = await db
      .select()
      .from(channelHistory)
      .where(
        and(
          eq(channelHistory.channelId, channelId),
          eq(channelHistory.period, period)
        )
      )
      .orderBy(desc(channelHistory.startDate))
      .limit(limit);

    return history;
  } catch (error) {
    console.error(`Error getting ${period} channel history:`, error);
    return [];
  }
}