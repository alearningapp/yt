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

  setText(text: string): void {
    this.text = text;
    this.currentIndex = 0;
  }

  setHighlightElement(element: HTMLElement): void {
    this.highlightElement = element;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  async startHighlighting(callback: (word: string, index: number) => void): Promise<void> {
    if (this.isHighlighting) {
      throw new Error('高亮正在进行中');
    }

    this.isHighlighting = true;
    this.currentIndex = 0;

    return new Promise((resolve) => {
      this.highlightInterval = setInterval(() => {
        if (this.currentIndex >= this.text.length) {
          this.stopHighlighting();
          resolve();
          return;
        }

        // 简单的分词逻辑（按空格和标点分割）
        const nextSpace = this.text.indexOf(' ', this.currentIndex);
        const nextPunctuation = this.text.substring(this.currentIndex).search(/[,.!?;:]/);
        const adjustedPunctuation = nextPunctuation === -1 ? -1 : this.currentIndex + nextPunctuation;
        
        let endIndex = Math.min(
          nextSpace === -1 ? this.text.length : nextSpace,
          adjustedPunctuation === -1 ? this.text.length : adjustedPunctuation + 1
        );

        if (endIndex === -1) {
          endIndex = this.text.length;
        }

        const word = this.text.substring(this.currentIndex, endIndex).trim();
        
        if (word && this.highlightElement) {
          this.highlightElement.textContent = word;
          callback(word, this.currentIndex);
        }

        this.currentIndex = endIndex;
      }, this.speed);
    });
  }

  stopHighlighting(): void {
    if (this.highlightInterval) {
      clearInterval(this.highlightInterval);
      this.highlightInterval = null;
    }
    this.isHighlighting = false;
  }

  getProgress(): number {
    if (!this.text) return 0;
    return (this.currentIndex / this.text.length) * 100;
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