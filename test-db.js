import postgres from 'postgres';

async function testDatabase() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('正在测试数据库连接...');
    
    // 测试连接
    const result = await client`SELECT 1 as test`;
    console.log('✅ 数据库连接成功');
    
    // 检查表是否存在
    const tables = ['articles', 'article_likes', 'article_views', 'article_audio', 'article_audio_segments'];
    
    for (const table of tables) {
      try {
        const tableExists = await client`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          )
        `;
        console.log(`${tableExists[0]?.exists ? '✅' : '❌'} 表 ${table}: ${tableExists[0]?.exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ 表 ${table}: 检查失败 - ${error.message}`);
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

testDatabase();