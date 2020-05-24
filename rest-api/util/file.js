const path = require('path');
const fs = require('fs');

exports.clearImage = filePath => {
    // filepath: 'images/imagename.png'
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
