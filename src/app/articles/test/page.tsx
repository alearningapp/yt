'use client';

import { useState, useRef } from 'react';
import { TextHighlighter } from '@/lib/audio-recorder';

export default function TestPage() {
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(200);
  
  const highlightElementRef = useRef<HTMLDivElement>(null);
  const textHighlighterRef = useRef(new TextHighlighter());

  // 测试文本：包含中英文混合内容
  const testText = `这是一个测试文本。This is a test text.
  
中文部分：今天天气很好，适合出去散步。
English part: The weather is nice today, perfect for a walk.

混合文本：Hello 世界！Welcome to 中国。`;

  const startTest = async () => {
    if (!highlightElementRef.current) return;

    setIsHighlighting(true);
    setCurrentWord('');
    setProgress(0);

    try {
      textHighlighterRef.current.setHighlightElement(highlightElementRef.current);
      textHighlighterRef.current.setText(testText);
      textHighlighterRef.current.setSpeed(speed);

      await textHighlighterRef.current.startHighlighting((word, index, isParagraphEnd) => {
        setCurrentWord(word);
        setProgress(textHighlighterRef.current.getProgress());
        console.log('当前词:', word, '段落结束:', isParagraphEnd);
      });
    } catch (error) {
      console.error('测试失败:', error);
    } finally {
      setIsHighlighting(false);
    }
  };

  const stopTest = () => {
    textHighlighterRef.current.stopHighlighting();
    setIsHighlighting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">中英文分词测试</h1>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium">播放速度:</label>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border rounded px-3 py-2"
            disabled={isHighlighting}
          >
            <option value={500}>慢速</option>
            <option value={200}>中速</option>
            <option value={100}>快速</option>
          </select>
        </div>

        <div className="mb-6">
          <button
            onClick={isHighlighting ? stopTest : startTest}
            className={`px-6 py-3 rounded font-medium ${
              isHighlighting 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isHighlighting ? '停止测试' : '开始测试'}
          </button>
        </div>

        {/* 当前高亮文字 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium mb-2">当前高亮文字:</h3>
          <div 
            ref={highlightElementRef}
            className="text-2xl font-bold text-blue-800 min-h-[60px] flex items-center justify-center text-center"
          >
            {currentWord || '准备开始...'}
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">
              进度: {progress.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 原始文本 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium mb-4">测试文本:</h3>
          <div className="prose prose-lg border rounded p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap">{testText}</pre>
          </div>
        </div>

        {/* 分词说明 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">分词规则说明:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 中文：按字符分割，遇到中文标点（，。！？；：、）或换行时停止</li>
            <li>• 英文：按空格和标点分割，遇到英文标点（,.!?;:）或换行时停止</li>
            <li>• 段落检测：支持中英文段落边界检测（换行符、句号+换行）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}