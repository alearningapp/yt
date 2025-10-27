'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { getArticleById, updateArticle, deleteArticle } from '@/lib/actions/articles';
import { ArticleWithDetails } from '@/types';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState<ArticleWithDetails | null>(null);
  
  const articleId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published',
  });

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const articleData = await getArticleById(articleId);
      if (!articleData) {
        setError('文章未找到');
        return;
      }

      // Check ownership
      if (!session?.user || articleData.userId !== session.user.id) {
        setError('无权编辑此文章');
        return;
      }

      setArticle(articleData);
      setFormData({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt || '',
        status: articleData.status as 'draft' | 'published',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!session?.user) {
        setError('请先登录');
        return;
      }
      await updateArticle(articleId, formData, session.user.id);
      router.push(`/articles/${articleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新文章失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
      return;
    }

    setDeleting(true);
    try {
      if (!session?.user) {
        setError('请先登录');
        return;
      }
      await deleteArticle(articleId, session.user.id);
      router.push('/my-articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文章失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateExcerpt = () => {
    if (formData.content.length > 0) {
      const excerpt = formData.content.substring(0, 200);
      handleInputChange('excerpt', excerpt + (formData.content.length > 200 ? '...' : ''));
    }
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

  if (error && !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">错误</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/articles">
            <Button>返回文章列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/articles/${articleId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章
          </Link>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">编辑文章</h1>
              <p className="text-gray-600 mt-2">修改您的文章内容</p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? '删除中...' : '删除文章'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="请输入文章标题"
                className="w-full"
              />
            </div>

            {/* Excerpt */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="excerpt">摘要</Label>
                <button
                  type="button"
                  onClick={generateExcerpt}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  自动生成摘要
                </button>
              </div>
              <Input
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder="文章摘要（可选，自动从内容生成）"
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                摘要将显示在文章列表中，帮助读者快速了解内容
              </p>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">内容 *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                required
                placeholder="请输入文章内容"
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                当前字数: {formData.content.length}
              </p>
            </div>

            {/* Status */}
            <div>
              <Label>发布状态</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mr-2"
                  />
                  保存为草稿
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="mr-2"
                  />
                  发布文章
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href={`/articles/${articleId}`}>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || !formData.title || !formData.content}
              >
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}