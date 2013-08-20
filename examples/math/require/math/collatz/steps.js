define(["require", "math/collatz/inc", "math/collatz/dec"],
    function(require, inc, dec) {
        return function(n) {
            if (n==1) return 0;
            if (n%2==0) return require("math/collatz/dec")(n);
            if (n%2==1) return require("math/collatz/inc")(n);
        };
    }
);
