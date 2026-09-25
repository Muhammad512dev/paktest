import { autoDetectAndFormatEquations } from './src/utils/equationDetector';

const optionHtml = `<p><img src="data:image/svg+xml;base64,12345" class="formula"></p>`;
const result = autoDetectAndFormatEquations(optionHtml, { isUrdu: false });

console.log('Result:', result);
console.log('Is empty?', result.trim() === '');
console.log('Length:', result.trim().length);
