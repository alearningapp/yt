'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { getUserArticles } from '@/lib/actions/articles';
import { ArticleWithDetails } from '@/types';
import { Calendar, Eye, Heart, Edit, FileText, Plus } from 'lucide-react';

interface UserArticlesResponse {
  articles: ArticleWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default function MyArticlesPage() {
  const { session } = useAuth();
  const [articles, setArticles] = useState<ArticleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (session) {
      loadArticles();
    }
  }, [session, page]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      if (!session?.user) {
        console.error('User not logged in');
        return;
      }
      const response: UserArticlesResponse = await getUserArticles(session.user.id, page, pageSize);
      setArticles(response.articles);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full";
    if (status === 'published') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录才能查看和管理您的文章。</p>
          <div className="space-x-2">
            <Link href="/signin">
              <Button variant="outline">登录</Button>
            </Link>
            <Link href="/signup">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的文章</h1>
            <p className="text-gray-600 mt-2">管理您创建的所有文章</p>
          </div>
          <Link href="/articles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              写新文章
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文章</h3>
            <p className="text-gray-600 mb-4">您还没有创建任何文章，开始写作吧！</p>
            <Link href="/articles/new">
              <Button>写第一篇文章</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {article.title}
                        </h2>
                        <span className={getStatusBadge(article.status)}>
                          {article.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </div>
                      
                      {article.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Link href={`/articles/${article.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          编辑
                        </Button>
                      </Link>
                      <Link href={`/articles/${article.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          查看
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.updatedAt)}</span>
                      </div>
                      {article.publishedAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>发布于 {formatDate(article.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{article.viewCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{article.likeCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <span className="flex items-center px-4 text-gray-600">
                  第 {page} 页，共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}