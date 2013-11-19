#!/usr/bin/env node
var fs = require("fs");
var path = require("path");
var ArgumentParser = require('argparse').ArgumentParser;

var core = require("./yamd.core");

var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp:true,
    description: 'Yet Another js Module Definition.'
});
parser.addArgument(
    ["path"], {
        help: 'a path to a folder containing library\'s files'
    }
);
parser.addArgument(
    ["-c", "--commonjs"], {
        action: "storeTrue"
    }
);

parser.addArgument(
    ["-a", "--amd"], {
        action: "storeTrue"
    }
);

var args = parser.parseArgs();
if (args.commonjs) {
    core.commonjs(args.path, ".");
} else if (args.amd) {
    core.amd(args.path, ".");
} else {
    core.iife(args.path, ".");
}
