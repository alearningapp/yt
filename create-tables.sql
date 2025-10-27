-- 创建文章表
CREATE TABLE IF NOT EXISTS article (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    user_id TEXT NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建文章点赞表
CREATE TABLE IF NOT EXISTS article_like (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    liked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建文章浏览表
CREATE TABLE IF NOT EXISTS article_view (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    user_id TEXT,
    viewed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建文章音频表
CREATE TABLE IF NOT EXISTS article_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    audio_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    duration INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建文章音频片段表
CREATE TABLE IF NOT EXISTS article_audio_segment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_id UUID NOT NULL REFERENCES article_audio(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_word INTEGER NOT NULL,
    end_word INTEGER NOT NULL,
    audio_url TEXT,
    duration INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);