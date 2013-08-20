function inc(n) {
    return require('./steps')(3*n+1)+1;
}

module.exports = inc;