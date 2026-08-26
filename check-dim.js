const fs = require('fs');
['public/images/league-logo.jpg', 'public/images/hero-bg.jpg'].forEach(f => {
  const buf = fs.readFileSync(f);
  let w = 0, h = 0;
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] === 0xC0 || buf[i + 1] === 0xC2)) {
      h = buf.readUInt16BE(i + 5);
      w = buf.readUInt16BE(i + 7);
      break;
    }
  }
  console.log(f + ': ' + w + 'x' + h + ' ratio=' + (w / h).toFixed(4));
});
