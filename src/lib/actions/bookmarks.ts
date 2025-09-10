'use server';

import { db } from '@/lib/db';
import { bookmarks, bookmarkLikes } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface BookmarkFormData {
  url: string;
  title: string;
  description?: string;
  status?: 'private' | 'public';
}

export async function createBookmark(data: BookmarkFormData, userId: string) {
  try {
    // Check if bookmark with the same URL already exists for this user
    const existingBookmark = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.url, data.url), eq(bookmarks.userId, userId)))
      .limit(1);

    if (existingBookmark.length > 0) {
      return { 
        success: false, 
        error: 'Bookmark with this URL already exists' 
      };
    }

    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        ...data,
        userId,
      })
      .returning();

    revalidatePath('/bookmarks');
    return { success: true, bookmark };
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return { success: false, error: 'Failed to create bookmark' };
  }
}

export async function getBookmarks(userId: string | null, page = 1, limit = 10, showAllPublic = false) {
  try {
    const offset = (page - 1) * limit;
    
    // Build the where clause based on user authentication and visibility
    let whereClause;
    if (userId && !showAllPublic) {
      // Authenticated user sees their own bookmarks (both private and public)
      whereClause = eq(bookmarks.userId, userId);
    } else if (userId && showAllPublic) {
      // Authenticated user sees all public bookmarks plus their own private ones
      whereClause = or(
        eq(bookmarks.status, 'public'),
        and(eq(bookmarks.status, 'private'), eq(bookmarks.userId, userId))
      );
    } else {
      // Guest user only sees public bookmarks
      whereClause = eq(bookmarks.status, 'public');
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const userBookmarks = await db
      .select({
        id: bookmarks.id,
        url: bookmarks.url,
        title: bookmarks.title,
        description: bookmarks.description,
        status: bookmarks.status,
        userId: bookmarks.userId,
        createdAt: bookmarks.createdAt,
        updatedAt: bookmarks.updatedAt,
        likeCount: sql<number>`count(${bookmarkLikes.id})`.as('likeCount'),
        isLiked: userId ? sql<boolean>`exists(
          select 1 from ${bookmarkLikes} 
          where ${bookmarkLikes.bookmarkId} = ${bookmarks.id} 
          and ${bookmarkLikes.userId} = ${userId}
        )`.as('isLiked') : sql<boolean>`false`.as('isLiked')
      })
      .from(bookmarks)
      .leftJoin(bookmarkLikes, eq(bookmarks.id, bookmarkLikes.bookmarkId))
      .where(whereClause)
      .groupBy(bookmarks.id)
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      bookmarks: userBookmarks,
      total,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return {
      bookmarks: [],
      total: 0,
      totalPages: 0
    };
  }
}

export async function toggleBookmarkLike(bookmarkId: string, userId: string) {
  try {
    // Check if user already liked this bookmark
    const existingLike = await db
      .select()
      .from(bookmarkLikes)
      .where(and(eq(bookmarkLikes.bookmarkId, bookmarkId), eq(bookmarkLikes.userId, userId)));

    if (existingLike.length > 0) {
      // Unlike
      await db
        .delete(bookmarkLikes)
        .where(and(eq(bookmarkLikes.bookmarkId, bookmarkId), eq(bookmarkLikes.userId, userId)));
    } else {
      // Like
      await db
        .insert(bookmarkLikes)
        .values({
          bookmarkId,
          userId,
        });
    }

    revalidatePath('/bookmarks');
    return { success: true };
  } catch (error) {
    console.error('Error toggling bookmark like:', error);
    return { success: false, error: 'Failed to toggle like' };
  }
}

export async function updateBookmark(bookmarkId: string, userId: string, data: Partial<BookmarkFormData>) {
  try {
    // Check if user owns the bookmark
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

    if (!bookmark) {
      return { success: false, error: 'Bookmark not found or unauthorized' };
    }

    const [updatedBookmark] = await db
      .update(bookmarks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(bookmarks.id, bookmarkId))
      .returning();

    revalidatePath('/bookmarks');
    return { success: true, bookmark: updatedBookmark };
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return { success: false, error: 'Failed to update bookmark' };
  }
}

export async function deleteBookmark(bookmarkId: string, userId: string) {
  try {
    // Check if user owns the bookmark
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

    if (!bookmark) {
      return { success: false, error: 'Bookmark not found or unauthorized' };
    }

    await db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId));
    revalidatePath('/bookmarks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return { success: false, error: 'Failed to delete bookmark' };
  }
}