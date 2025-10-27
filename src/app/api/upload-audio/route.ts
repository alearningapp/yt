import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const segmentIndex = formData.get('segmentIndex') as string;
    const articleId = formData.get('articleId') as string;

    if (!file || !segmentIndex || !articleId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: '只支持音频文件' },
        { status: 400 }
      );
    }

    // 创建存储目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'audio', articleId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成文件名
    const timestamp = Date.now();
    const filename = `segment-${segmentIndex}-${timestamp}.mp3`;
    const filepath = join(uploadDir, filename);

    // 将文件写入磁盘
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 返回文件URL
    const audioUrl = `/uploads/audio/${articleId}/${filename}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      filename,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('音频上传失败:', error);
    return NextResponse.json(
      { error: '音频上传失败' },
      { status: 500 }
    );
  }
}