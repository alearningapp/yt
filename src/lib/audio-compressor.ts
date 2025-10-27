export class AudioCompressor {
  async compressAudio(audioBlob: Blob, quality: number = 0.7): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个音频上下文
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            
            // 解码音频数据
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // 创建一个离线音频上下文进行压缩
            const offlineContext = new OfflineAudioContext(
              audioBuffer.numberOfChannels,
              audioBuffer.length,
              audioBuffer.sampleRate
            );
            
            // 创建音频源
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 创建压缩器
            const compressor = offlineContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-24, offlineContext.currentTime);
            compressor.knee.setValueAtTime(30, offlineContext.currentTime);
            compressor.ratio.setValueAtTime(12, offlineContext.currentTime);
            compressor.attack.setValueAtTime(0.003, offlineContext.currentTime);
            compressor.release.setValueAtTime(0.25, offlineContext.currentTime);
            
            // 连接节点
            source.connect(compressor);
            compressor.connect(offlineContext.destination);
            
            // 开始渲染
            source.start();
            const renderedBuffer = await offlineContext.startRendering();
            
            // 将压缩后的音频转换为Blob
            const wavBlob = this.audioBufferToWav(renderedBuffer);
            resolve(wavBlob);
            
          } catch (error) {
            reject(new Error('音频压缩失败: ' + error));
          }
        };
        
        fileReader.onerror = () => reject(new Error('文件读取失败'));
        fileReader.readAsArrayBuffer(audioBlob);
        
      } catch (error) {
        reject(new Error('音频压缩初始化失败: ' + error));
      }
    });
  }
  
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels * 2;
    const bufferArray = new ArrayBuffer(44 + length);
    const view = new DataView(bufferArray);
    
    // WAV文件头
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numChannels, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // 音频数据
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }
  
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}