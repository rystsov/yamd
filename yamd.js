#!/usr/bin/env node
var fs = require("fs");
var path = require("path");
var ArgumentParser = require('argparse').ArgumentParser;

function shift(lines, times) {
    times = typeof times === "undefined" ? 1 : times;
    var offset = new Array(times + 1).join("    ");
    return lines.map(function(line) { return offset + line; });
}

function JS(code) {
    this.lines = [];
    this.addLine = function(line) {
        this.lines.push(line);
    };
    this.addList = function(lines) {
        lines.forEach(function(line){
            this.add(line);
        }.bind(this));
    };
    this.addJS = function(js) {
        this.addList(js.lines);
    };
    this.addFragment = function(fragment) {
        fragment.split("\n").forEach(function(line){
            this.lines.push(line);
        }.bind(this));
    };
    this.add = function(code) {
        if (typeof code === "string" || code instanceof String) {
            this.addFragment(code);
        } else if (code instanceof Array) {
            this.addList(code)
        } else if (code instanceof JS) {
            this.addJS(code);
        } else {
            throw new Error();
        }
    };
    this.shift = function (times) {
        this.lines = shift(this.lines, times);
        return this;
    };
    this.str = function(){
        return this.lines.join("\n");
    };

    if (typeof code !== "undefined") this.add(code);
}

function collect(dir, prefix, data) {
    fs.readdirSync(dir).forEach(function(file){
        var stat = fs.lstatSync(dir + "/" + file), path;
        if (stat.isDirectory()) {
            path = prefix.slice();
            path.push(file);
            collect(dir + "/" + file, path, data)
        }
        if (stat.isFile()) {
            if (file.indexOf(".js", file.length - 3) !== -1) {
                path = prefix.slice();
                path.push(file.substring(0, file.length - 3));
                data.push([path, fs.readFileSync(dir + "/" + file, 'UTF-8')]);
            }
        }
    });
}

var boilerplate = fs.readFileSync(path.resolve(__dirname, 'boilerplate.js'), 'UTF-8');

function renderfile(file, usecomma) {
    return new JS([
        "{",
        new JS([
            "path: " + JSON.stringify(file[0]) + ",",
            "content: function(root, expose) {",
            new JS(file[1]).shift(),
            "}"
        ]).shift(),
        "}" + (usecomma ? "," : "")
    ]);
}

function renderiife(name, data) {
    return new JS([
        "var " + name + " = (function(){",
            new JS([
                "return (function(){",
                    new JS(boilerplate).shift(),
                "})();",
                "function data(data, hack) {",
                    new JS([
                        "if (data || hack) {",
                            new JS("// removes unused parameter warning").shift(),
                        "}",
                        "return [",
                            data.map(function(item, i) { return renderfile(item, i+1 != data.length).shift(); }),
                        "];"
                    ]).shift(),
                "}"
            ]).shift(),
        "})();"
    ]);
}

function rendercommonjs(name, data) {
    return new JS([
        renderiife(name, data),
        "module.exports = " + name + ";"
    ]);
}

function renderAMD(name, data) {
    return new JS([
        "define([], function() {",
            new JS([
                renderiife(name, data),
                "return " + name + ";"
            ]).shift(),
        "});"
    ]);
}

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
var data = [];
collect(args.path,[],data);
if (data.length==0) {
    throw new Error();
}
var name = path.basename(args.path);
if (args.commonjs) {
    fs.writeFileSync(name + ".common.js", rendercommonjs(name, data).str(), {flag: "w"});
}
if (args.amd) {
    fs.writeFileSync(name + ".amd.js", renderAMD(name, data).str(), {flag: "w"});
}
fs.writeFileSync(name + ".js", renderiife(name, data).str(), {flag: "w"});
