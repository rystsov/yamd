var table = {};
var inited = false;

function ctor() {
    table[3] = steps(3);
}

function steps(n) {
    if (!inited) {
        ctor();
        inited = true
    }
    if (n==1) return 0;
    if (n%2==0) return require('./dec')(n);
    if (n%2==1) return require('./inc')(n);
}

module.exports = tableLookup(table, steps)

function tableLookup(table, f) {
    return function(n) {
        if (n in table) return table[n];
        return f(n);
    }
}