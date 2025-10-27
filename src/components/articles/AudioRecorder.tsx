'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AudioRecorder, TextHighlighter } from '@/lib/audio-recorder';
import { AudioCompressor } from '@/lib/audio-compressor';

interface AudioRecorderProps {
  articleContent: string;
  articleId: string;
  userId: string;
  onSave: (audioData: any) => void;
}

export default function ArticleAudioRecorder({ articleContent, articleId, userId, onSave }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(200); // 默认速度（毫秒/字）
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  
  const audioRecorderRef = useRef(new AudioRecorder());
  const textHighlighterRef = useRef(new TextHighlighter());
  const audioCompressorRef = useRef(new AudioCompressor());
  const highlightElementRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    textHighlighterRef.current.setText(articleContent);
    if (highlightElementRef.current) {
      textHighlighterRef.current.setHighlightElement(highlightElementRef.current);
    }
  }, [articleContent]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      recordingStartRef.current = Date.now();
      setAudioBlob(null);
      
      // 初始化文字高亮器
      if (highlightElementRef.current) {
        textHighlighterRef.current.setHighlightElement(highlightElementRef.current);
        textHighlighterRef.current.setText(articleContent);
        textHighlighterRef.current.setSpeed(speed);
      }
      
      await audioRecorderRef.current.startRecording();
      
      // 开始逐字高亮
      await textHighlighterRef.current.startHighlighting((word, index, isParagraphEnd) => {
        const currentProgress = textHighlighterRef.current.getProgress();
        setCurrentWord(word);
        setProgress(currentProgress);
        
        // 当进度达到100%时自动停止录制
        if (currentProgress >= 99.9 ) {
          console.log('进度达到100%，自动停止录制');
          setTimeout(() => {
            stopRecording();
          }, 100);
        }
      });
      
    } catch (error) {
      console.error('录音失败:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (audioRecorderRef.current.getRecordingState()) {
        const audioBlob = await audioRecorderRef.current.stopRecording();
        setAudioBlob(audioBlob);
        console.log('录制完成，音频Blob大小:', audioBlob.size);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  };



  const playAudio = async () => {
    if (!audioBlob) {
      console.error('没有可播放的音频');
      return;
    }
    
    if (!audioPlayerRef.current) {
      console.error('音频播放器未初始化');
      return;
    }
    
    try {
      // 创建对象URL并播放
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('创建音频URL:', audioUrl, 'Blob大小:', audioBlob.size);
      
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.load(); // 重新加载音频
      
      // 重置文字高亮
      textHighlighterRef.current.stopHighlighting();
      setCurrentWord('');
      setProgress(0);
      
      // 添加播放结束监听器
      const onEnded = () => {
        console.log('音频播放结束');
        setIsPlaying(false);
        textHighlighterRef.current.stopHighlighting();
        setCurrentWord('');
        setProgress(0);
        URL.revokeObjectURL(audioUrl); // 清理对象URL
      };
      
      audioPlayerRef.current.onended = onEnded;
      audioPlayerRef.current.onerror = (error) => {
        console.error('音频播放失败:', error);
        setIsPlaying(false);
        textHighlighterRef.current.stopHighlighting();
        setCurrentWord('');
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
      };
      
      // 等待音频加载完成
      await new Promise((resolve, reject) => {
        if (!audioPlayerRef.current) {
          reject(new Error('音频播放器不存在'));
          return;
        }
        
        audioPlayerRef.current.oncanplaythrough = () => {
          console.log('音频可以播放');
          resolve(true);
        };
        
        audioPlayerRef.current.onerror = (error) => {
          console.error('音频加载失败:', error);
          reject(error);
        };
        
        // 设置超时
        setTimeout(() => {
          console.log('音频加载超时，尝试强制播放');
          resolve(true);
        }, 3000);
      });
      
      console.log('开始播放音频');
      await audioPlayerRef.current.play();
      setIsPlaying(true);
      
      // 开始文字高亮同步
      await textHighlighterRef.current.startHighlighting((word, index, isParagraphEnd) => {
        const currentProgress = textHighlighterRef.current.getProgress();
        setCurrentWord(word);
        setProgress(currentProgress);
      });
      
      console.log('成功开始播放音频并同步文字高亮');
    } catch (error) {
      console.error('播放音频失败:', error);
      setIsPlaying(false);
      textHighlighterRef.current.stopHighlighting();
      setCurrentWord('');
      setProgress(0);
    }
  };



  // 添加音频播放器事件监听
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (audioPlayer) {
      const handleEnded = () => {
        setIsPlaying(false);
        textHighlighterRef.current.stopHighlighting();
        setCurrentWord('');
        setProgress(0);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
        textHighlighterRef.current.stopHighlighting();
      };
      
      const handlePlay = () => {
        setIsPlaying(true);
      };
      
      audioPlayer.addEventListener('ended', handleEnded);
      audioPlayer.addEventListener('pause', handlePause);
      audioPlayer.addEventListener('play', handlePlay);
      
      return () => {
        audioPlayer.removeEventListener('ended', handleEnded);
        audioPlayer.removeEventListener('pause', handlePause);
        audioPlayer.removeEventListener('play', handlePlay);
      };
    }
  }, []);



  const compressAndSave = async () => {
    try {
      if (!audioBlob) {
        console.error('没有可保存的音频');
        return;
      }
      
      const compressedBlob = await audioCompressorRef.current.compressAudio(audioBlob);
      
      // 这里需要实现上传到服务器的逻辑
      onSave({
        articleId,
        userId,
        audioBlob: compressedBlob,
        fileSize: compressedBlob.size,
        status: 'draft',
      });
      
    } catch (error) {
      console.error('音频压缩保存失败:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">录制文章音频</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-3">
            <span className="min-w-[80px]">播放速度:</span>
            <div className="flex items-center space-x-3">
              <input 
                type="range" 
                min="50" 
                max="1000" 
                step="10"
                value={speed} 
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-32"
                disabled={isRecording}
              />
              <span className="text-sm text-gray-600 min-w-[80px]">
                {Math.round(1000 / speed)} 字/秒
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 文章内容区域（用于高亮显示） */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">文章内容（播放时实时高亮）</h4>
          <div 
            ref={highlightElementRef}
            className="prose prose-lg max-w-none bg-white p-4 rounded border min-h-[200px] leading-relaxed"
          >
            {articleContent.split('').map((char, index) => (
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
          <div className="mt-2">
            <div className="text-sm text-gray-600 mb-1">
              当前高亮: {currentWord || '等待开始...'} | 进度: {progress.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording ? (
          <Button onClick={startRecording} disabled={isPlaying}>
            🎤 开始录制
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive">
            ⏹️ 停止录制
          </Button>
        )}
        
        <Button onClick={compressAndSave} disabled={!audioBlob}>
          💾 保存音频
        </Button>
        
        {/* 调试按钮 */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            console.log('调试信息:');
            console.log('audioBlob:', audioBlob);
            console.log('isRecording:', isRecording);
            console.log('isPlaying:', isPlaying);
            console.log('progress:', progress);
          }}
        >
          🐛 调试信息
        </Button>
      </div>

      {/* 音频管理 */}
      {audioBlob && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">音频管理</h4>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <span className="font-medium">完整音频</span>
              <span className="text-sm text-gray-600 ml-2">
                (大小: {(audioBlob.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={playAudio}
                disabled={isPlaying}
              >
                ▶️ 播放试听
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  if (confirm('确定要重新录制吗？这将清除当前录制的音频。')) {
                    setAudioBlob(null);
                    setProgress(0);
                    setCurrentWord('');
                  }
                }}
              >
                🔄 重新录制
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的音频播放器 */}
      <audio 
        ref={audioPlayerRef}
        controls
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error('音频播放器错误:', e)}
      />
    </div>
  );
}