'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { getArticles } from '@/lib/actions/articles';
import { ArticleWithDetails } from '@/types';
import { Calendar, Eye, Heart, User } from 'lucide-react';

interface ArticlesResponse {
  articles: ArticleWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default function ArticlesPage() {
  const { session } = useAuth();
  const [articles, setArticles] = useState<ArticleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadArticles();
  }, [page]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response: ArticlesResponse = await getArticles(page, pageSize);
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">文章</h1>
            <p className="text-gray-600 mt-2">发现社区分享的精彩内容</p>
          </div>
          {session && (
            <Link href="/articles/new">
              <Button>写文章</Button>
            </Link>
          )}
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
            <p className="text-gray-600 mb-4">还没有人发布文章，成为第一个分享者吧！</p>
            {session ? (
              <Link href="/articles/new">
                <Button>写第一篇文章</Button>
              </Link>
            ) : (
              <div className="space-x-2">
                <Link href="/signin">
                  <Button variant="outline">登录</Button>
                </Link>
                <Link href="/signup">
                  <Button>注册</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/articles/${article.id}`} className="block p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      {article.title}
                    </h2>
                    
                    {article.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{article.user?.name || '匿名用户'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                        </div>
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
                  </Link>
                </article>
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