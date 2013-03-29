var FS = require('fs'),
    Q = require('bem/node_modules/q'),
    PATH = require('bem/lib/path'),
    LESS = require('less');

exports.techMixin = {

    getBuildResults: function(prefixes, outputDir, outputName) {
        var _this = this,
        	res = {};
        /* pass single prefix-es for getBuildResult so as to get css/less groupped */
        return prefixes.then(function(prefixes) {
        	return Q.all (prefixes.map(function(prefix) {
        		return Q.all (_this.getSuffixes().map (function (suffix) {
        			var path = prefix + '.' + suffix;
        			if (PATH.existsSync(path)) {
    					return _this.getBuildResult(prefix, suffix, outputDir,	outputName);
        			} else {
        				return Q.resolve('');
        			}
        		}));
        	}));
        });
    },

	getBuildResult: function(prefixes, suffix, outputDir, outputName) {
        var _this = this;

        return Q.when(this.filterPrefixes([prefixes], [suffix]), function(paths) {
            return Q.all(paths.map(function(path) {
            	return _this.getBuildResultChunk(
                    PATH.relative(outputDir, path), path, suffix);
            }));
        });
    },      

    storeBuildResults: function(prefix, res) {
        var _this = this;
        return Q.when(res, function(res) {
            return _this.storeBuildResult(_this.getPath(prefix, 'css'), 'css', _this.compileBuildResults(res));
        });
    },

    compileBuildResults: function(res) {
        var result = Q.defer(),
            flatRes = res;

        /* res =  [ [ [], [] ], [ [], [] ] ]; */ 
        for (var i in flatRes) {
        	flatRes[i] = flatRes[i].join('');
        }
        flatRes = flatRes.join('');
       	LESS.render(flatRes, function(err, css) {
            if (err) return result.reject(err);

            return result.resolve(css);
        });
        return result.promise;
    },

    getBuildResultChunk: function(relPath, path, suffix) {
        return this.wrapBuildResultChunk(this.readContent(path, suffix), relPath);
    },

    wrapBuildResultChunk: function(chunk, path) {

        return Q.when(chunk)
            .then(function(chunk) {
                return [
                    '/* ' + path + ': begin */ /**/',
                    chunk + ';',
                    '/* ' + path + ': end */ /**/',
                    '\n'].join('\n');

            });

    },

    /**
	 * Collect `.less` and `.css` files from blocks on `bem build`.
	 *
	 * @return {Array}
	 */
    getSuffixes: function() {
        return ['css', 'less'];
    },

    /**
	 * Create only `.less` files for blocks on `bem create`.
	 *
	 * @return {Array}
	 */
    getCreateSuffixes: function() {
        return ['less'];
    },

    /**
	 * Template for new files created by `bem create`.
	 *
	 * @return {String}
	 */
    getCreateResult: function(path, suffix, vars) {

    	var Template = require('bem/lib/template');

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? '_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal : '') : '');

        return Template.process([
        	'@var: none;',
        	"\n",
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    }
};
