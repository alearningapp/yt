export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      throw new Error('无法访问麦克风: ' + error);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        throw new Error('没有正在进行的录音');
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.isRecording = false;
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}

export class TextHighlighter {
  private text = '';
  private currentIndex = 0;
  private highlightElement: HTMLElement | null = null;
  private speed = 200;
  private isHighlighting = false;
  private highlightInterval: NodeJS.Timeout | null = null;
  private originalContent = '';

  setText(text: string): void {
    this.text = text;
    this.currentIndex = 0;
    this.originalContent = text;
  }

  setHighlightElement(element: HTMLElement): void {
    this.highlightElement = element;
    // 保存原始内容
    this.originalContent = element.innerHTML;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  async startHighlighting(callback: (word: string, index: number, isParagraphEnd: boolean) => void): Promise<void> {
    if (this.isHighlighting) {
      throw new Error('高亮正在进行中');
    }

    this.isHighlighting = true;
    this.currentIndex = 0;

    // 初始化字符分割
    if (this.highlightElement) {
      this.initializeCharacterSpans();
    }

    return new Promise((resolve) => {
      this.highlightInterval = setInterval(() => {
        if (this.currentIndex >= this.text.length) {
          // 确保进度显示为100%
          callback('', this.text.length, false);
          
          // 播放完成后延迟1秒停止高亮
          setTimeout(() => {
            this.stopHighlighting();
            resolve();
          }, 1000);
          return;
        }

        // 检测段落结束（换行符或中文句号后跟换行符）
        const nextParagraphEnd = this.text.indexOf('\n\n', this.currentIndex);
        const nextSentenceEnd = this.text.indexOf('.\n', this.currentIndex);
        const nextChineseSentenceEnd = this.text.indexOf('。\n', this.currentIndex);
        
        let paragraphEndIndex = -1;
        const possibleEnds = [nextParagraphEnd, nextSentenceEnd, nextChineseSentenceEnd].filter(index => index !== -1);
        
        if (possibleEnds.length > 0) {
          paragraphEndIndex = Math.min(...possibleEnds);
        }

        // 智能分词逻辑：标点符号作为独立字符
        const currentChar = this.text[this.currentIndex];
        
        // 检查当前字符是否为标点符号
        const isPunctuation = /[，。！？；：、,.!?;:\n]/.test(currentChar);
        
        let endIndex = this.currentIndex + 1;
        
        if (isPunctuation) {
          // 标点符号：单独作为一个字符
          endIndex = this.currentIndex + 1;
        } else {
          // 非标点符号：检查是中文还是英文
          const isChinese = /[\u4e00-\u9fff]/.test(currentChar);
          
          if (isChinese) {
            // 中文：严格按字符分割，每个字符单独高亮
            endIndex = this.currentIndex + 1;
          } else {
            // 英文：按空格和标点分割
            const nextSpace = this.text.indexOf(' ', this.currentIndex);
            const nextPunctuation = this.text.substring(this.currentIndex).search(/[,.!?;:\n]/);
            const adjustedPunctuation = nextPunctuation === -1 ? -1 : this.currentIndex + nextPunctuation;
            
            endIndex = Math.min(
              nextSpace === -1 ? this.text.length : nextSpace,
              adjustedPunctuation === -1 ? this.text.length : adjustedPunctuation
            );
            
            // 确保至少前进一个字符
            if (endIndex <= this.currentIndex) {
              endIndex = this.currentIndex + 1;
            }
          }
        }

        // 如果检测到段落结束，优先使用段落结束位置
        if (paragraphEndIndex !== -1 && paragraphEndIndex < endIndex) {
          endIndex = paragraphEndIndex + 2; // 包括换行符
        }

        if (endIndex === -1) {
          endIndex = this.text.length;
        }

        const word = this.text.substring(this.currentIndex, endIndex);
        const isParagraphEnd = paragraphEndIndex !== -1 && endIndex >= paragraphEndIndex;
        
        // 在原文中高亮显示当前文字
        if (this.highlightElement) {
          this.highlightWordInOriginalText(this.currentIndex, endIndex);
        }

        callback(word, this.currentIndex, isParagraphEnd);
        this.currentIndex = endIndex;
      }, this.speed);
    });
  }

  // 在原文中高亮显示当前文字
  private highlightWordInOriginalText(startIndex: number, endIndex: number): void {
    if (!this.highlightElement) return;

    // 清除之前的高亮
    const allSpans = this.highlightElement.querySelectorAll('span.char-highlight');
    allSpans.forEach(span => {
      span.classList.remove('active');
    });

    // 高亮当前范围的字符
    for (let i = startIndex; i < endIndex; i++) {
      const charSpan = this.highlightElement.querySelector(`span[data-index="${i}"]`);
      if (charSpan) {
        charSpan.classList.add('active');
      }
    }
  }

  // 初始化字符分割
  private initializeCharacterSpans(): void {
    if (!this.highlightElement) return;

    // 将文本分割为单个字符，每个字符用span包裹
    const chars = Array.from(this.text);
    let htmlContent = '';
    
    chars.forEach((char, index) => {
      if (char === '\n') {
        htmlContent += '<br>';
      } else {
        htmlContent += `<span class="char-highlight" data-index="${index}">${char}</span>`;
      }
    });

    this.highlightElement.innerHTML = htmlContent;
    
    // 添加CSS样式
    if (!this.highlightElement.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        .char-highlight {
          transition: all 0.2s ease;
          padding: 1px 2px;
          border-radius: 2px;
        }
        .char-highlight.active {
          background-color: yellow;
          color: black;
          font-weight: bold;
        }
      `;
      this.highlightElement.appendChild(style);
    }
  }

  stopHighlighting(): void {
    if (this.highlightInterval) {
      clearInterval(this.highlightInterval);
      this.highlightInterval = null;
    }
    this.isHighlighting = false;
    
    // 恢复原始内容
    if (this.highlightElement) {
      this.highlightElement.innerHTML = this.originalContent;
    }
  }

  getProgress(): number {
    if (!this.text) return 0;
    const progress = (this.currentIndex / this.text.length) * 100;
    // 确保进度不会超过100%
    return Math.min(progress, 100);
  }

  isActive(): boolean {
    return this.isHighlighting;
  }
}

export class AudioSegmentManager {
  private segments = new Map<number, Blob>();

  addSegment(index: number, audioBlob: Blob): void {
    this.segments.set(index, audioBlob);
  }

  getSegment(index: number): Blob | undefined {
    return this.segments.get(index);
  }

  removeSegment(index: number): void {
    this.segments.delete(index);
  }

  getAllSegments(): Map<number, Blob> {
    return new Map(this.segments);
  }

  clearSegments(): void {
    this.segments.clear();
  }

  getSegmentCount(): number {
    return this.segments.size;
  }
}