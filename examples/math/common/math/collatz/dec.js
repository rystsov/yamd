function dec(n) {
    return require('./steps')(n/2)+1;
}

module.exports = dec;