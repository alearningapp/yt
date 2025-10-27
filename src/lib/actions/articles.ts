'use server';

import { db } from '@/lib/db';
import { articles, articleLikes, articleViews, user } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ArticleFormData, ArticleWithDetails } from '@/types';

export async function createArticle(data: ArticleFormData, userId: string) {
  try {
    console.log('Creating article with data:', { title: data.title, status: data.status, userId });
    
    const articleData = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 200) + '...',
      status: data.status,
      userId: userId,
      publishedAt: data.status === 'published' ? new Date() : null,
    };

    console.log('Article data to insert:', articleData);
    
    const [newArticle] = await db.insert(articles).values(articleData).returning();
    
    console.log('Article created successfully:', newArticle);
    
    revalidatePath('/articles');
    revalidatePath('/my-articles');
    
    return newArticle;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
}

export async function updateArticle(id: string, data: ArticleFormData, userId: string) {
  // Verify article ownership
  const [existingArticle] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, userId)));

  if (!existingArticle) {
    throw new Error('Article not found or access denied');
  }

  const updateData = {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt || data.content.substring(0, 200) + '...',
    status: data.status,
    publishedAt: data.status === 'published' && existingArticle.status !== 'published' 
      ? new Date() 
      : existingArticle.publishedAt,
    updatedAt: new Date(),
  };

  const [updatedArticle] = await db
    .update(articles)
    .set(updateData)
    .where(eq(articles.id, id))
    .returning();
  
  revalidatePath('/articles');
  revalidatePath('/my-articles');
  revalidatePath(`/articles/${id}`);
  
  return updatedArticle;
}

export async function deleteArticle(id: string, userId: string) {
  // Verify article ownership
  const [existingArticle] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, userId)));

  if (!existingArticle) {
    throw new Error('Article not found or access denied');
  }

  await db.delete(articles).where(eq(articles.id, id));
  
  revalidatePath('/articles');
  revalidatePath('/my-articles');
  
  return { success: true };
}

export async function getArticles(page: number = 1, pageSize: number = 10) {
  const offset = (page - 1) * pageSize;

  const articlesWithDetails = await db
    .select({
      article: articles,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      likeCount: count(articleLikes.id),
      viewCount: count(articleViews.id),
    })
    .from(articles)
    .where(eq(articles.status, 'published'))
    .leftJoin(user, eq(articles.userId, user.id))
    .leftJoin(articleLikes, eq(articles.id, articleLikes.articleId))
    .leftJoin(articleViews, eq(articles.id, articleViews.articleId))
    .groupBy(articles.id, user.id)
    .orderBy(desc(articles.publishedAt))
    .limit(pageSize)
    .offset(offset);

  const [totalCountResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, 'published'));

  const totalCount = totalCountResult?.count || 0;

  return {
    articles: articlesWithDetails.map(item => ({
      ...item.article,
      user: item.user,
      likeCount: Number(item.likeCount),
      viewCount: Number(item.viewCount),
    })),
    totalCount,
    page,
    pageSize,
  };
}

export async function getArticleById(id: string) {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  const userId = session?.user.id;

  const [articleWithDetails] = await db
    .select({
      article: articles,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      likeCount: count(articleLikes.id),
      viewCount: count(articleViews.id),
      isLiked: userId ? sql<number>`CASE WHEN EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId}) THEN 1 ELSE 0 END` : sql<number>`0`,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .leftJoin(user, eq(articles.userId, user.id))
    .leftJoin(articleLikes, eq(articles.id, articleLikes.articleId))
    .leftJoin(articleViews, eq(articles.id, articleViews.articleId))
    .groupBy(articles.id, user.id);

  if (!articleWithDetails) {
    return null;
  }

  // Record view if user is viewing
  if (articleWithDetails.article.status === 'published') {
    await db.insert(articleViews).values({
      articleId: id,
      userId: userId || null,
    });
  }

  return {
    ...articleWithDetails.article,
    user: articleWithDetails.user,
    likeCount: Number(articleWithDetails.likeCount),
    viewCount: Number(articleWithDetails.viewCount),
    isLiked: Boolean(Number(articleWithDetails.isLiked)),
  };
}

export async function getUserArticles(userId: string, page: number = 1, pageSize: number = 10) {
  const offset = (page - 1) * pageSize;

  const articlesWithDetails = await db
    .select({
      article: articles,
      likeCount: count(articleLikes.id),
      viewCount: count(articleViews.id),
    })
    .from(articles)
    .where(eq(articles.userId, userId))
    .leftJoin(articleLikes, eq(articles.id, articleLikes.articleId))
    .leftJoin(articleViews, eq(articles.id, articleViews.articleId))
    .groupBy(articles.id)
    .orderBy(desc(articles.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const [totalCountResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.userId, userId));

  const totalCount = totalCountResult?.count || 0;

  return {
    articles: articlesWithDetails.map(item => ({
      ...item.article,
      likeCount: Number(item.likeCount),
      viewCount: Number(item.viewCount),
    })),
    totalCount,
    page,
    pageSize,
  };
}

export async function toggleArticleLike(articleId: string, userId: string) {
  // Check if already liked
  const [existingLike] = await db
    .select()
    .from(articleLikes)
    .where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId)));

  if (existingLike) {
    // Unlike
    await db
      .delete(articleLikes)
      .where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId)));
  } else {
    // Like
    await db.insert(articleLikes).values({
      articleId,
      userId,
    });
  }

  revalidatePath(`/articles/${articleId}`);
  revalidatePath('/articles');

  return { success: true };
}