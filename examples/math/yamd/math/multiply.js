expose(multiply);

function multiply(a,b) {
    var result = 0;
    for (var i=0;i<a;i++) {
        result = root.add(result, b);
    }
    return result;
}
