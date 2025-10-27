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
  const [currentSegment, setCurrentSegment] = useState(0);
  const [segments, setSegments] = useState<Map<number, Blob>>(new Map());
  
  const audioRecorderRef = useRef(new AudioRecorder());
  const textHighlighterRef = useRef(new TextHighlighter());
  const segmentManagerRef = useRef(new AudioSegmentManager());
  const audioCompressorRef = useRef(new AudioCompressor());
  const highlightElementRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    textHighlighterRef.current.setText(articleContent);
    if (highlightElementRef.current) {
      textHighlighterRef.current.setHighlightElement(highlightElementRef.current);
    }
  }, [articleContent]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await audioRecorderRef.current.startRecording();
      
      // 开始逐字高亮
      textHighlighterRef.current.setSpeed(speed);
      await textHighlighterRef.current.startHighlighting((word, index) => {
        setCurrentWord(word);
        setProgress(textHighlighterRef.current.getProgress());
      });
      
      // 录音结束
      const audioBlob = await audioRecorderRef.current.stopRecording();
      segmentManagerRef.current.addSegment(currentSegment, audioBlob);
      setSegments(new Map(segmentManagerRef.current.getAllSegments()));
      
      setIsRecording(false);
      setCurrentSegment(prev => prev + 1);
    } catch (error) {
      console.error('录音失败:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (audioRecorderRef.current.getRecordingState()) {
        const audioBlob = await audioRecorderRef.current.stopRecording();
        segmentManagerRef.current.addSegment(currentSegment, audioBlob);
        setSegments(new Map(segmentManagerRef.current.getAllSegments()));
        setIsRecording(false);
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  };

  const playSegment = async (segmentIndex: number) => {
    const segmentBlob = segmentManagerRef.current.getSegment(segmentIndex);
    if (segmentBlob && audioPlayerRef.current) {
      const audioUrl = URL.createObjectURL(segmentBlob);
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlaying = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const reRecordSegment = async (segmentIndex: number) => {
    segmentManagerRef.current.removeSegment(segmentIndex);
    setSegments(new Map(segmentManagerRef.current.getAllSegments()));
    setCurrentSegment(segmentIndex);
  };

  const compressAndSave = async () => {
    try {
      const compressedSegments: any[] = [];
      
      for (const [index, blob] of segments.entries()) {
        const compressedBlob = await audioCompressorRef.current.compressAudio(blob);
        compressedSegments.push({
          segmentIndex: index,
          audioBlob: compressedBlob,
          duration: 0, // 需要计算实际时长
          fileSize: compressedBlob.size,
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

      {/* 当前高亮文字 */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div 
            ref={highlightElementRef}
            className="text-2xl font-bold text-blue-800 min-h-[40px] flex items-center justify-center"
          >
            {currentWord || '准备开始...'}
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              进度: {progress.toFixed(1)}%
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
          <h4 className="font-semibold mb-4">已录制的段落</h4>
          <div className="space-y-3">
            {Array.from(segments.entries()).map(([index, blob]) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>段落 {index + 1}</span>
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