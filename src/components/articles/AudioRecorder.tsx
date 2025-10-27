'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AudioRecorder, TextHighlighter, AudioSegmentManager } from '@/lib/audio-recorder';
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
  const [segments, setSegments] = useState<Map<number, {blob: Blob, startTime: number, endTime: number, duration: number}>>(new Map());
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  
  const audioRecorderRef = useRef(new AudioRecorder());
  const textHighlighterRef = useRef(new TextHighlighter());
  const audioCompressorRef = useRef(new AudioCompressor());
  const highlightElementRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const recordingStartRef = useRef<number>(0);
  const segmentMarkersRef = useRef<number[]>([]);

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
      segmentMarkersRef.current = [0]; // 第一个段落的开始时间
      
      // 初始化文字高亮器
      if (highlightElementRef.current) {
        textHighlighterRef.current.setHighlightElement(highlightElementRef.current);
        textHighlighterRef.current.setText(articleContent);
        textHighlighterRef.current.setSpeed(speed);
      }
      
      await audioRecorderRef.current.startRecording();
      
      // 开始逐字高亮，并在段落边界自动分段
      await textHighlighterRef.current.startHighlighting((word, index, isParagraphEnd) => {
        setCurrentWord(word);
        setProgress(textHighlighterRef.current.getProgress());
        
        // 如果是段落结束，记录分段时间点
        if (isParagraphEnd) {
          const currentTime = Date.now() - recordingStartRef.current;
          segmentMarkersRef.current.push(currentTime);
          console.log(`段落结束，时间点: ${currentTime}ms`);
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
        
        // 处理分段音频
        await processSegmentedAudio(audioBlob);
        
        setIsRecording(false);
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  };

  const processSegmentedAudio = async (fullAudioBlob: Blob) => {
    try {
      // 创建音频上下文
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const arrayBuffer = await fullAudioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      
      // 根据分段标记切割音频
      const newSegments = new Map();
      const sampleRate = audioBuffer.sampleRate;
      
      for (let i = 0; i < segmentMarkersRef.current.length - 1; i++) {
        const startTime = segmentMarkersRef.current[i];
        const endTime = segmentMarkersRef.current[i + 1] || audioBuffer.duration * 1000;
        
        const startSample = Math.floor(startTime / 1000 * sampleRate);
        const endSample = Math.floor(endTime / 1000 * sampleRate);
        
        // 创建新的音频缓冲区
        const segmentBuffer = audioContextRef.current.createBuffer(
          audioBuffer.numberOfChannels,
          endSample - startSample,
          sampleRate
        );
        
        // 复制音频数据
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const segmentData = segmentBuffer.getChannelData(channel);
          segmentData.set(channelData.subarray(startSample, endSample));
        }
        
        // 转换为Blob
        const segmentBlob = await audioBufferToBlob(segmentBuffer);
        
        newSegments.set(i, {
          blob: segmentBlob,
          startTime: startTime,
          endTime: endTime,
          duration: (endTime - startTime) / 1000
        });
      }
      
      setSegments(newSegments);
      
    } catch (error) {
      console.error('音频分段处理失败:', error);
    }
  };

  const audioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numberOfChannels * 2;
      const bufferArray = new ArrayBuffer(44 + length);
      const view = new DataView(bufferArray);
      
      // WAV文件头
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, audioBuffer.sampleRate, true);
      view.setUint32(28, audioBuffer.sampleRate * 2 * numberOfChannels, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);
      
      // 音频数据
      let offset = 44;
      for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      resolve(new Blob([view], { type: 'audio/wav' }));
    });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const playSegment = async (segmentIndex: number) => {
    const segmentData = segments.get(segmentIndex);
    if (segmentData && audioPlayerRef.current) {
      try {
        // 创建对象URL并播放
        const audioUrl = URL.createObjectURL(segmentData.blob);
        audioPlayerRef.current.src = audioUrl;
        
        // 添加播放结束监听器
        const onEnded = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl); // 清理对象URL
        };
        
        audioPlayerRef.current.onended = onEnded;
        audioPlayerRef.current.onerror = () => {
          console.error('音频播放失败');
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audioPlayerRef.current.play();
        setIsPlaying(true);
        console.log(`开始播放段落 ${segmentIndex + 1}`);
      } catch (error) {
        console.error('播放音频失败:', error);
        setIsPlaying(false);
      }
    }
  };

  const stopPlaying = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // 添加音频播放器事件监听
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (audioPlayer) {
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
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

  const reRecordSegment = async (segmentIndex: number) => {
    // 对于连续录制，重新录制需要重新开始整个录制过程
    // 这里可以提示用户需要重新录制整个音频
    if (confirm('重新录制将清除所有已录制的段落。确定要重新录制吗？')) {
      setSegments(new Map());
      segmentMarkersRef.current = [0];
      await startRecording();
    }
  };

  const compressAndSave = async () => {
    try {
      const compressedSegments: any[] = [];
      
      for (const [index, segmentData] of segments.entries()) {
        const compressedBlob = await audioCompressorRef.current.compressAudio(segmentData.blob);
        compressedSegments.push({
          segmentIndex: index,
          audioBlob: compressedBlob,
          duration: segmentData.duration,
          fileSize: compressedBlob.size,
          startTime: segmentData.startTime,
          endTime: segmentData.endTime,
        });
      }
      
      // 这里需要实现上传到服务器的逻辑
      onSave({
        articleId,
        userId,
        segments: compressedSegments,
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
          <label className="flex items-center space-x-2">
            <span>播放速度:</span>
            <select 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="border rounded px-2 py-1"
              disabled={isRecording}
            >
              <option value={300}>慢速</option>
              <option value={200}>中速</option>
              <option value={100}>快速</option>
            </select>
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
        
        <Button onClick={compressAndSave} disabled={segments.size === 0}>
          💾 保存音频
        </Button>
      </div>

      {/* 音频片段管理 */}
      {segments.size > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">已录制的段落 ({segments.size} 个段落)</h4>
          <div className="space-y-3">
            {Array.from(segments.entries()).map(([index, segmentData]) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">段落 {index + 1}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    (时长: {segmentData.duration.toFixed(1)}秒)
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => playSegment(index)}
                    disabled={isPlaying}
                  >
                    ▶️ 播放
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => reRecordSegment(index)}
                  >
                    🔄 重录
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 隐藏的音频播放器 */}
      <audio 
        ref={audioPlayerRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}