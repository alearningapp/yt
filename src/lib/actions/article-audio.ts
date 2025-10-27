'use server';

import { db } from '@/lib/db';
import { articleAudio, articleAudioSegments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

export async function createArticleAudio(data: ArticleAudioData) {
  try {
    const [audio] = await db.insert(articleAudio).values({
      articleId: data.articleId,
      userId: data.userId,
      audioUrl: data.audioUrl,
      status: data.status,
      duration: data.duration,
      fileSize: data.fileSize,
    }).returning();

    // 插入音频片段
    if (data.segments.length > 0) {
      await db.insert(articleAudioSegments).values(
        data.segments.map(segment => ({
          audioId: audio.id,
          segmentIndex: segment.segmentIndex,
          startWord: segment.startWord,
          endWord: segment.endWord,
          audioUrl: segment.audioUrl,
          duration: segment.duration,
          fileSize: segment.fileSize,
        }))
      );
    }

    return { success: true, audio };
  } catch (error) {
    console.error('Failed to create article audio:', error);
    return { success: false, error: '创建文章音频失败' };
  }
}

export async function updateArticleAudio(audioId: string, data: Partial<ArticleAudioData>, userId: string) {
  try {
    const [audio] = await db.update(articleAudio)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(articleAudio.id, audioId), eq(articleAudio.userId, userId)))
      .returning();

    if (!audio) {
      return { success: false, error: '音频未找到或无权访问' };
    }

    return { success: true, audio };
  } catch (error) {
    console.error('Failed to update article audio:', error);
    return { success: false, error: '更新文章音频失败' };
  }
}

export async function getArticleAudio(articleId: string, userId: string) {
  try {
    const audio = await db.query.articleAudio.findFirst({
      where: and(
        eq(articleAudio.articleId, articleId),
        eq(articleAudio.userId, userId)
      ),
      with: {
        segments: {
          orderBy: [articleAudioSegments.segmentIndex],
        },
      },
    });

    return { success: true, audio };
  } catch (error) {
    console.error('Failed to get article audio:', error);
    return { success: false, error: '获取文章音频失败' };
  }
}

export async function deleteArticleAudio(audioId: string, userId: string) {
  try {
    const [audio] = await db.delete(articleAudio)
      .where(and(eq(articleAudio.id, audioId), eq(articleAudio.userId, userId)))
      .returning();

    if (!audio) {
      return { success: false, error: '音频未找到或无权访问' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete article audio:', error);
    return { success: false, error: '删除文章音频失败' };
  }
}

export async function publishArticleAudio(audioId: string, userId: string) {
  try {
    const [audio] = await db.update(articleAudio)
      .set({
        status: 'published',
        updatedAt: new Date(),
      })
      .where(and(eq(articleAudio.id, audioId), eq(articleAudio.userId, userId)))
      .returning();

    if (!audio) {
      return { success: false, error: '音频未找到或无权访问' };
    }

    return { success: true, audio };
  } catch (error) {
    console.error('Failed to publish article audio:', error);
    return { success: false, error: '发布文章音频失败' };
  }
}