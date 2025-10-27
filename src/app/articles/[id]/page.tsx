'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { getArticleById, toggleArticleLike } from '@/lib/actions/articles';
import { getArticleAudio } from '@/lib/actions/article-audio';
import { ArticleWithDetails } from '@/types';
import { Calendar, Eye, Heart, User, Edit, Trash2, ArrowLeft, Volume2, Mic, Play, Square } from 'lucide-react';
import AudioPlayer from '@/components/articles/AudioPlayer';
import { TextHighlighter } from '@/lib/audio-recorder';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const [article, setArticle] = useState<ArticleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [articleAudio, setArticleAudio] = useState<any>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [progress, setProgress] = useState(0);
  const [highlightedText, setHighlightedText] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const textHighlighterRef = useRef(new TextHighlighter());

  const articleId = params.id as string;

  useEffect(() => {
    loadArticle();
    loadArticleAudio();
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

  const loadArticleAudio = async () => {
    if (!session?.user) return;
    
    setAudioLoading(true);
    try {
      const result = await getArticleAudio(articleId, session.user.id);
      if (result.success) {
        setArticleAudio(result.audio);
      }
    } catch (error) {
      console.error('Failed to load article audio:', error);
    } finally {
      setAudioLoading(false);
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

  // 播放音频并同步文字高亮
  const playAudioWithHighlight = async () => {
    if (!articleAudio || !contentRef.current || !article) return;
    
    try {
      // 初始化文字高亮器
      textHighlighterRef.current.setHighlightElement(contentRef.current);
      textHighlighterRef.current.setText(article.content);
      textHighlighterRef.current.setSpeed(300); // 中等速度
      
      // 开始文字高亮
      await textHighlighterRef.current.startHighlighting((word, index, isParagraphEnd) => {
        setCurrentWord(word);
        setProgress(textHighlighterRef.current.getProgress());
      });
      
      // 播放音频
      if (audioPlayerRef.current) {
        await audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
      textHighlighterRef.current.stopHighlighting();
      setCurrentWord('');
      setProgress(0);
    }
  };

  // 处理音频播放结束
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (audioPlayer) {
      const handleEnded = () => {
        setIsPlaying(false);
        // 播放完成后延迟1秒停止高亮
        setTimeout(() => {
          textHighlighterRef.current.stopHighlighting();
          setCurrentWord('');
          setProgress(0);
        }, 1000);
      };
      
      audioPlayer.addEventListener('ended', handleEnded);
      
      return () => {
        audioPlayer.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

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
            ref={contentRef}
            className="prose prose-lg max-w-none relative leading-relaxed"
          >
            {article.content.split('').map((char, index) => (
              char === '\n' ? (
                <br key={index} />
              ) : (
                <span 
                  key={index}
                  className="char-highlight inline-block px-0.5 transition-all duration-200"
                  data-index={index}
                >
                  {char}
                </span>
              )
            ))}
          </div>
          
          {/* Audio Controls */}
          {articleAudio && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">音频播放</h4>
                <div className="flex items-center space-x-2">
                  {!isPlaying ? (
                    <Button 
                      size="sm" 
                      onClick={playAudioWithHighlight}
                      className="flex items-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>播放</span>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={stopAudio}
                      className="flex items-center space-x-1"
                    >
                      <Square className="w-4 h-4" />
                      <span>停止</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Progress and Current Word */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>当前高亮: {currentWord || '等待播放...'}</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                
                {/* 播放速度滑块 */}
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm">播放速度:</span>
                  <input 
                    type="range" 
                    min="200" 
                    max="1000" 
                    step="10"
                    value={300} 
                    onChange={(e) => textHighlighterRef.current.setSpeed(Number(e.target.value))}
                    className="w-24"
                    disabled={isPlaying}
                  />
                  <span className="text-sm min-w-[60px]">
                    {Math.round(1000 / 300)} 字/秒
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Hidden Audio Player */}
              <audio
                ref={audioPlayerRef}
                src={articleAudio.audioUrl}
                preload="metadata"
                className="hidden"
              />
            </div>
          )}
        </article>

        {/* Audio Section */}
        {isOwner && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              文章音频
            </h3>
            
            {articleAudio ? (
              <div className="space-y-4">
                <AudioPlayer audioUrl={articleAudio.audioUrl || ''} />
                <div className="flex space-x-2 text-sm text-gray-600">
                  <span>时长: {Math.floor((articleAudio.duration || 0) / 60)}分钟</span>
                  <span>大小: {Math.round((articleAudio.fileSize || 0) / 1024)}KB</span>
                  <span>状态: {articleAudio.status === 'published' ? '已发布' : '草稿'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">这篇文章还没有录制音频</p>
                <Link href={`/articles/${articleId}/record-audio`}>
                  <Button>
                    <Mic className="w-4 h-4 mr-2" />
                    开始录制音频
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

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
            <div className="flex space-x-4 items-center">
              <div className="text-sm text-gray-500">
                状态: {article.status === 'published' ? '已发布' : '草稿'}
              </div>
              {!articleAudio && (
                <Link href={`/articles/${articleId}/record-audio`}>
                  <Button size="sm" variant="outline">
                    <Mic className="w-4 h-4 mr-2" />
                    录制音频
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}