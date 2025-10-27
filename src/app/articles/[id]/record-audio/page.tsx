'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getArticleById } from '@/lib/actions/articles';
import { createArticleAudio } from '@/lib/actions/article-audio';
import ArticleAudioRecorder from '@/components/articles/AudioRecorder';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RecordAudioPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const articleId = params.id as string;
  
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const article = await getArticleById(articleId);
      if (article) {
        setArticle(article);
      } else {
        setError('文章未找到');
      }
    } catch (err) {
      setError('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAudio = async (audioData: any) => {
    try {
      if (!session?.user) {
        setError('请先登录');
        return;
      }

      const result = await createArticleAudio({
        articleId: audioData.articleId,
        userId: audioData.userId,
        status: audioData.status,
        segments: audioData.segments.map((segment: any, index: number) => ({
          segmentIndex: index,
          startWord: 0, // 需要根据实际文本计算
          endWord: 0,   // 需要根据实际文本计算
          audioUrl: '', // 需要上传到服务器后获取URL
          duration: segment.duration,
          fileSize: segment.fileSize,
        })),
      });

      if (result.success) {
        router.push(`/articles/${articleId}`);
      } else {
        setError(result.error || '保存音频失败');
      }
    } catch (err) {
      setError('保存音频失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href={`/articles/${articleId}`} className="text-blue-600 mt-4 inline-block">
            返回文章
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">文章未找到</p>
          <Link href="/articles" className="text-blue-600 mt-4 inline-block">
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/articles/${articleId}`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回文章
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">录制文章音频</h1>
          <p className="text-gray-600 mt-2">为文章《{article.title}》录制音频</p>
        </div>

        {/* Article Content Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">文章内容预览</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{article.content}</p>
          </div>
        </div>

        {/* Audio Recorder */}
        {session?.user && (
          <ArticleAudioRecorder
            articleContent={article.content}
            articleId={articleId}
            userId={session.user.id}
            onSave={handleSaveAudio}
          />
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-800 mb-3">使用说明</h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• 点击"开始录制"按钮开始录音，系统会逐字高亮显示文字</li>
            <li>• 按照高亮速度朗读文字，系统会自动录音</li>
            <li>• 可以调整播放速度来控制高亮显示的速度</li>
            <li>• 可以随时停止录制，系统会保存当前段落</li>
            <li>• 可以播放已录制的段落进行试听</li>
            <li>• 对不满意的段落可以重新录制</li>
            <li>• 录制完成后点击"保存音频"保存到服务器</li>
          </ul>
        </div>
      </div>
    </div>
  );
}