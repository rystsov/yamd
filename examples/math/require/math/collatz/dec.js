define(["require", "math/collatz/steps"],
    function(require, steps) {
        return function(n) {
            return require("math/collatz/steps")(n/2)+1;
        };
    }
);
