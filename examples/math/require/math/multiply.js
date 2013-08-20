define(["math/add"], function(add) {
    return function(a,b) {
        var result = 0;
        for (var i=0;i<a;i++) {
            result = add(result, b);
        }
        return result;
    };
});
