import postgres from 'postgres';

async function cleanupDuplicateTables() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('正在清理重复的表...');
    
    // 要删除的复数命名表
    const tablesToDrop = [
      'articles',
      'article_likes', 
      'article_views',
      'article_audio_segments'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await client.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ 删除表 ${table}`);
      } catch (error) {
        console.log(`❌ 删除表 ${table} 失败: ${error.message}`);
      }
    }
    
    // 验证剩余的表
    const remainingTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'article%'
    `;
    
    console.log('清理后剩余的表:', remainingTables.map(r => r.table_name));
    
    await client.end();
    console.log('✅ 表清理完成！');
    
  } catch (error) {
    console.error('❌ 清理表失败:', error.message);
  }
}

cleanupDuplicateTables();