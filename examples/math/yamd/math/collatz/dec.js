expose(dec)

function dec(n) {
    return root.collatz.steps(n/2)+1;
}
