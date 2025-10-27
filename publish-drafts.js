import postgres from 'postgres';

async function publishDrafts() {
  try {
    const connectionString = "postgresql://postgresql:password@localhost:5432/helpyt";
    const client = postgres(connectionString);
    
    console.log('正在将草稿文章发布...');
    
    // 将所有草稿文章更新为已发布状态
    const result = await client`
      UPDATE article 
      SET status = 'published', published_at = NOW() 
      WHERE status = 'draft'
    `;
    
    console.log(`✅ 成功发布了 ${result.count} 篇草稿文章`);
    
    // 验证更新结果
    const publishedArticles = await client`
      SELECT id, title, status, published_at 
      FROM article 
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    
    console.log(`\n现在已发布的文章有 ${publishedArticles.length} 篇:`);
    publishedArticles.forEach(article => {
      console.log(`- ID: ${article.id}, 标题: "${article.title}", 发布时间: ${article.published_at}`);
    });
    
    await client.end();
    
  } catch (error) {
    console.error('发布草稿失败:', error.message);
  }
}

publishDrafts();