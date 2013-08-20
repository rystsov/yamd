expose(inc)

function inc(n) {
    return root.collatz.steps(3*n+1)+1;
}
