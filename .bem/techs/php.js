var Q = require('bem/node_modules/q'),
    QFS = require('bem/node_modules/q-fs');

exports.baseTechPath = require.resolve('../../bem-bl/blocks-common/i-bem/bem/techs/html'); 

exports.techMixin = {
    storeCreateResult: function(path, suffix, res, force) {
        var exec = require("child_process").exec;
        var deferred = Q.defer();

        var phpLine = "echo \""+res.replace(/([$"])/g,'\\$1')+"\" | php --"; 

        var bemUtil = require('../../node_modules/bem/lib/util');
        exec(phpLine, function (error, stdout, stderr) {
            deferred.resolve(stdout);   
        });

        return this.__base (path, suffix, deferred.promise, true);
    }
}
