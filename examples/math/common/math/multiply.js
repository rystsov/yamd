var add = require('./add');

function multiply(a,b) {
    var result = 0;
    for (var i=0;i<a;i++) {
        result = add(result, b);
    }
    return result;
}

module.exports = multiply;
