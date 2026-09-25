const text = `<p><img src="data:image/svg+xml;base64,12345" class="formula"></p>`;
let step1 = text.replace(/<\s*\/?\s*p\b[^>]*>/gi, ' ');
let step2 = step1.replace(/<\s*\/?\s*(?:div|span|strong|em|b|i)\b[^>]*>/gi, ' ');
console.log('step2:', step2);
