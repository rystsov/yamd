module.exports = function(grunt) {
    var mkdirp = require('mkdirp');
    var core = require("../yamd.core");

    grunt.registerTask("yamd", "Yet Another Module Definition", function() {
        var opt = grunt.config.get("yamd");

        mkdirp.sync(opt.target);
        if (opt.to) {
            if (opt.to.indexOf("iife") >= 0) core.iife(opt.library, opt.target);
            if (opt.to.indexOf("commonjs") >= 0) core.commonjs(opt.library, opt.target);
            if (opt.to.indexOf("amd") >= 0) core.amd(opt.library, opt.target);
        } else {
            core.iife(opt.library, opt.target);
        }
    });
};
