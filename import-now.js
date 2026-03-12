const fs = require('fs');

// Read the production export
const exportData = JSON.parse(fs.readFileSync('production-export.json', 'utf8'));

console.log('📊 Found content to import:');
console.log(`  - Categories: ${exportData.categories?.length || 0}`);
console.log(`  - Articles: ${exportData.articles?.length || 0}`);

// Featured articles
const featuredArticles = exportData.articles?.filter(a => a.isFeatured) || [];
console.log(`  - Featured articles: ${featuredArticles.length}`);

console.log('\n⭐ Featured articles that should appear on homepage:');
featuredArticles.forEach(article => {
  console.log(`  - ${article.title}`);
});

console.log('\n📝 First 5 articles:');
exportData.articles?.slice(0, 5).forEach(article => {
  const status = article.isFeatured ? '⭐' : (article.isPublished ? '✅' : '❌');
  console.log(`  ${status} ${article.title} (${article.category || 'No category'})`);
});

console.log('\n🔗 Sample article with video:');
const videoArticle = exportData.articles?.find(a => a.videoUrl);
if (videoArticle) {
  console.log(`  Title: ${videoArticle.title}`);
  console.log(`  Video: ${videoArticle.videoUrl}`);
  console.log(`  Published: ${videoArticle.isPublished}`);
  console.log(`  Featured: ${videoArticle.isFeatured}`);
}

console.log(`\n💡 Your export data is ready! The API endpoint should import ${exportData.articles?.length || 0} articles.`);
