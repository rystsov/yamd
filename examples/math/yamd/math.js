var math = (function(){
    return (function(){
        var files = data.apply(null);
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
        }
    })();
    function data(data, hack) {
        if (data || hack) {
            // removes unused parameter warning
        }
        return [
            {
                path: ["add"],
                content: function(root, expose) {
                    expose(add);
                    
                    function add(a, b) {
                        return a + b;
                    }
                    
                }
            },
            {
                path: ["collatz","dec"],
                content: function(root, expose) {
                    expose(dec)
                    
                    function dec(n) {
                        return root.collatz.steps(n/2)+1;
                    }
                    
                }
            },
            {
                path: ["collatz","inc"],
                content: function(root, expose) {
                    expose(inc)
                    
                    function inc(n) {
                        return root.collatz.steps(3*n+1)+1;
                    }
                    
                }
            },
            {
                path: ["collatz","steps"],
                content: function(root, expose) {
                    var table = {};
                    
                    expose(tableLookup(table, steps), ctor);
                    
                    function ctor() {
                        table[3] = steps(3);
                    }
                    
                    function steps(n) {
                        if (n==1) return 0;
                        if (n%2==0) return root.collatz.dec(n);
                        if (n%2==1) return root.collatz.inc(n);
                    }
                    
                    function tableLookup(table, f) {
                        return function(n) {
                            if (n in table) return table[n];
                            return f(n);
                        }
                    }
                }
            },
            {
                path: ["distributions"],
                content: function(root, expose) {
                    expose({
                        normal: normal,
                        bernoulli: bernoulli
                    });
                    
                    function normal() {
                        throw new Error("TODO");
                    }
                    
                    function bernoulli() {
                        throw new Error("TODO");
                    }
                }
            },
            {
                path: ["multiply"],
                content: function(root, expose) {
                    expose(multiply);
                    
                    function multiply(a,b) {
                        var result = 0;
                        for (var i=0;i<a;i++) {
                            result = root.add(result, b);
                        }
                        return result;
                    }
                    
                }
            }
        ];
    }
})();