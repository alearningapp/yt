import postgres from 'postgres';

async function checkArticles() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('检查数据库中的文章...');
    
    // 检查所有文章（包括草稿）
    const allArticles = await client`
      SELECT id, title, status, published_at, created_at, user_id 
      FROM article 
      ORDER BY created_at DESC
    `;
    
    console.log(`数据库中共有 ${allArticles.length} 篇文章:`);
    allArticles.forEach(article => {
      console.log(`- ID: ${article.id}, 标题: "${article.title}", 状态: ${article.status}, 创建时间: ${article.created_at}`);
    });
    
    // 检查已发布的文章
    const publishedArticles = await client`
      SELECT id, title, status, published_at, created_at, user_id 
      FROM article 
      WHERE status = 'published'
      ORDER BY created_at DESC
    `;
    
    console.log(`\n已发布的文章有 ${publishedArticles.length} 篇:`);
    publishedArticles.forEach(article => {
      console.log(`- ID: ${article.id}, 标题: "${article.title}", 发布时间: ${article.published_at}`);
    });
    
    await client.end();
    
  } catch (error) {
    console.error('检查文章失败:', error.message);
  }
}

checkArticles();