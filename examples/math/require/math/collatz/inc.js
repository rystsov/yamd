define(["require", "math/collatz/steps"],
    function(require, steps) {
        return function(n) {
            return require("math/collatz/steps")(3*n+1)+1;
        };
    }
);
