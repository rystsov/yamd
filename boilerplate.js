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