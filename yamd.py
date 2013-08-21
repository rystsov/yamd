import os
import json
import argparse

boilerplate = """var files = data.apply(null);
var library = {};
Object.keys(files).forEach(function(i){
    initModuleStructure(library, library, files[i].path, files[i].content);
});
var ctors = [];
Object.keys(files).forEach(function(i){
    addModuleContentCollectCtor(library, library, files[i].path, files[i].content, ctors);
});
ctors.forEach(function(x){ x(); });
return library;

function initModuleStructure(library, namespace, path, content) {
    if (path.length==0) throw new Error();
    if (path.length>1) {
        var name = path[0];
        if (!(name in namespace)) {
            namespace[name] = {};
        }
        initModuleStructure(library, namespace[name], path.slice(1), content);
    }
    if (path.length==1) {
        var exposed = null;
        try {
            content.apply(null, [library, function(obj) {
                exposed = obj;
                throw new ExposeBreak();
            }]);
        } catch (e) {
            if (!(e instanceof ExposeBreak)) {
                throw new Error(e);
            }
        }
        if (exposed!=null) {
            if (typeof exposed==="object") {
                namespace[path[0]] = {};
            }
        }
    }
    function ExposeBreak() {}
}
function addModuleContentCollectCtor(library, namespace, path, content, ctors) {
    if (path.length>1) {
        addModuleContentCollectCtor(library, namespace[path[0]], path.slice(1), content, ctors);
    }
    if (path.length==1) {
        content.apply(null, [library, function(obj, ctor) {
            if (ctor) ctors.push(ctor);
            namespace[path[0]] = obj;
        }]);
    }
}"""


def shift(lines, times=1):
    return map(lambda line: ("    "*times) + line, lines)

class JS:
    def __init__(self, code = None):
        self.lines = []
        if code is not None:
            self.add(code)
    def addLine(self, line):
        self.lines.append(line)
    def addList(self, lines):
        for line in lines:
            self.add(line)
    def addJS(self, js):
        self.addList(js.lines)
    def addFragment(self, fragment):
        for line in fragment.split("\n"):
            self.lines.append(line)
    def add(self, code):
        if isinstance(code, basestring):
            if "\n" in code:
                self.addFragment(code)
            else:
                self.addLine(code)
        elif isinstance(code, list):
            self.addList(code)
        elif isinstance(code, JS):
            self.addJS(code)
        else:
            raise Exception()
    def shift(self, times=1):
        self.lines = shift(self.lines, times)
        return self
    def __str__(self):
        return "\n".join(self.lines)


def collect(dir, prefix, data):
    for file in os.listdir(dir):
        if os.path.isdir(dir + "/" + file):
            path = list(prefix)
            path.append(file)
            collect(dir + "/" + file, path, data)
        if os.path.isfile(dir + "/" + file):
            if file[-3:] == ".js":
                with open(dir + "/" + file) as content:
                    path = list(prefix)
                    path.append(file[0:-3])
                    data.append((path, content.read()))

def renderfile(file, usecomma):
    return JS([
        "{",
            JS([
                "path: %s," % json.dumps(file[0]),
                "content: function(root, expose) {",
                    JS(file[1]).shift(),
                "}"
            ]).shift(),
        "}" + ("," if usecomma else "")
    ])

def renderiife(name, data):
    return JS([
        "var %s = (function(){" % name,
            JS([
                "return (function(){",
                    JS(boilerplate).shift(),
                "})();",
                "function data(data, hack) {",
                    JS([
                        "if (data || hack) {",
                            JS("// removes unused parameter warning").shift(),
                        "}",
                        "return [",
                            map(lambda i: renderfile(data[i], data[i]!=data[-1]).shift(), range(0,len(data))),
                        "];"
                    ]).shift(),
                "}"
            ]).shift(),
        "})();"
    ])

def rendercommonjs(name, data):
    return JS([
        renderiife(name, data),
        "module.exports = %s;" % name
    ])

parser = argparse.ArgumentParser(description='Yet Another js Module Definition.')
parser.add_argument('path', help="path to a folder containing library's files")
parser.add_argument('-c', dest='withcommon', action='store_const',
    const=True, default=False,
    help='generate with a common.js module (none by default)')
args = parser.parse_args()

data = []
collect(args.path,[],data)
if len(data)==0:
    raise Exception("There are no files to concat")
name = os.path.split(args.path)[1]

if args.withcommon:
    with open(name + ".common.js","w") as module:
        module.write(str(rendercommonjs(name, data))+"\n")
else:
    with open(name + ".js","w") as module:
        module.write(str(renderiife(name, data))+"\n")
