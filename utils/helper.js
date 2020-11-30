const fs = require('fs');

module.exports = {
  toBase64String(file) {
    var bitmap = fs.readFileSync(file);

    return new Buffer.from(bitmap).toString('base64');
  },
};
