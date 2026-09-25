const text = `<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" class="formula">`;
const regex2 = /src=["'](data:image\/([^;]+);base64,([^"']+))["']/g;
let match;
while ((match = regex2.exec(text)) !== null) {
    console.log('Match 0:', match[0]);
    console.log('Match 1:', match[1].substring(0, 50));
    console.log('Match 2:', match[2]);
    console.log('Match 3:', match[3]);
}
