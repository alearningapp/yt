import postgres from 'postgres';
import fs from 'fs';

async function createTables() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('正在连接到数据库...');
    
    // 读取SQL文件
    const sql = fs.readFileSync('create-tables.sql', 'utf8');
    
    console.log('正在创建表...');
    
    // 执行SQL
    await client.unsafe(sql);
    
    console.log('✅ 表创建成功！');
    
    // 验证表是否创建成功
    const tables = ['articles', 'article_likes', 'article_views', 'article_audio', 'article_audio_segments'];
    
    for (const table of tables) {
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
    console.error('❌ 创建表失败:', error.message);
  }
}

createTables();