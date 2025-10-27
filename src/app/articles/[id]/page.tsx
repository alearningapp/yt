'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { getArticleById, toggleArticleLike } from '@/lib/actions/articles';
import { ArticleWithDetails } from '@/types';
import { Calendar, Eye, Heart, User, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [article, setArticle] = useState<ArticleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  const articleId = params.id as string;

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const articleData = await getArticleById(articleId);
      setArticle(articleData);
    } catch (error) {
      console.error('Failed to load article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session) {
      router.push('/signin');
      return;
    }

    setLiking(true);
    try {
      if (!session?.user) {
        console.error('User not logged in');
        return;
      }
      await toggleArticleLike(articleId, session.user.id);
      await loadArticle(); // Reload article to get updated like status
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">文章未找到</h1>
          <p className="text-gray-600 mb-6">您要查找的文章不存在或已被删除。</p>
          <Link href="/articles">
            <Button>返回文章列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === article.user?.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/articles" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章列表
          </Link>
          
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{article.user?.name || '匿名用户'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>{article.viewCount} 阅读</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>{article.likeCount} 喜欢</span>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex space-x-2 ml-4">
                <Link href={`/articles/${article.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <article className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }}
          />
        </article>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant={article.isLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={liking}
            className="flex items-center space-x-2"
          >
            <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-current' : ''}`} />
            <span>{article.isLiked ? '已喜欢' : '喜欢'}</span>
            <span>({article.likeCount})</span>
          </Button>

          {isOwner && (
            <div className="text-sm text-gray-500">
              状态: {article.status === 'published' ? '已发布' : '草稿'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}