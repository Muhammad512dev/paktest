const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('C:\\Users\\HP\\Downloads\\Match the columns.mht', 'utf-8');
console.log('First 500 chars:');
console.log(content.substring(0, 500));
