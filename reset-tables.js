import postgres from 'postgres';

async function resetTables() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('正在删除现有表...');
    
    // 删除表的顺序很重要（先删除有外键依赖的表）
    const tables = [
      'article_audio_segment',
      'article_audio', 
      'article_view',
      'article_like',
      'article'
    ];
    
    for (const table of tables) {
      try {
        await client.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ 删除表 ${table}`);
      } catch (error) {
        console.log(`❌ 删除表 ${table} 失败: ${error.message}`);
      }
    }
    
    console.log('正在重新创建表...');
    
    // 读取并执行创建表的SQL
    const sql = `
      -- 创建文章表
      CREATE TABLE article (
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
      CREATE TABLE article_like (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          liked_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- 创建文章浏览表
      CREATE TABLE article_view (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES article(id) ON DELETE CASCADE,
          user_id TEXT,
          viewed_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- 创建文章音频表
      CREATE TABLE article_audio (
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
      CREATE TABLE article_audio_segment (
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
    `;
    
    await client.unsafe(sql);
    console.log('✅ 表创建成功！');
    
    // 验证表是否创建成功
    const tableNames = ['article', 'article_like', 'article_view', 'article_audio', 'article_audio_segment'];
    
    for (const table of tableNames) {
      const tableExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        )
      `;
      console.log(`${tableExists[0]?.exists ? '✅' : '❌'} 表 ${table}: ${tableExists[0]?.exists ? '存在' : '不存在'}`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ 重置表失败:', error.message);
  }
}

resetTables();