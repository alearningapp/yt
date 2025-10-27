'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { createArticle } from '@/lib/actions/articles';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewArticlePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published',
  });

  // Redirect if not authenticated
  if (!session) {
    router.push('/signin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!session?.user) {
        setError('请先登录');
        return;
      }
      await createArticle(formData, session.user.id);
      router.push('/articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建文章失败');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/articles" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章列表
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">写新文章</h1>
          <p className="text-gray-600 mt-2">分享您的知识和见解</p>
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
                placeholder="请输入文章内容（支持 Markdown 格式）"
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
                  立即发布
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href="/articles">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || !formData.title || !formData.content}
              >
                {loading ? '保存中...' : formData.status === 'published' ? '发布文章' : '保存草稿'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}