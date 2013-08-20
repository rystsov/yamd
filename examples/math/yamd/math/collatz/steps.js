var table = {};

expose(tableLookup(table, steps), ctor);

function ctor() {
    table[3] = steps(3);
}

function steps(n) {
    if (n==1) return 0;
    if (n%2==0) return root.collatz.dec(n);
    if (n%2==1) return root.collatz.inc(n);
}

function tableLookup(table, f) {
    return function(n) {
        if (n in table) return table[n];
        return f(n);
    }
}