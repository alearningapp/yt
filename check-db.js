import { db } from './src/lib/db/index.js';

async function checkDatabase() {
  try {
    console.log('正在检查数据库连接...');
    
    // 尝试查询一个简单的表来测试连接
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ 数据库连接成功');
    
    // 检查文章相关表是否存在
    const tables = [
      'articles',
      'article_likes', 
      'article_views',
      'article_audio',
      'article_audio_segments'
    ];
    
    for (const table of tables) {
      try {
        const tableExists = await db.execute(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`);
        console.log(`${tableExists.rows[0]?.exists ? '✅' : '❌'} 表 ${table}: ${tableExists.rows[0]?.exists ? '存在' : '不存在'}`);
      } catch (error) {
        console.log(`❌ 表 ${table}: 检查失败 - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

checkDatabase();