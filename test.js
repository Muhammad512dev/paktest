const html = '<div class="english-col"><div>Question 1</div></div>';
const match = html.match(/<div[^>]*class=["\'][^"\']*english-col[^"\']*["\']>([\s\S]*?)<\/div>/i);
console.log(match);
