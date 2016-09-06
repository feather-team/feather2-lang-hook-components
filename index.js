'use strict';

var path = require('path');

function findResource(name, maps){
	var info, list = [
		name,
		name + '/index',
		name + '/' + path.basename(name)
	], exts = feather.config.get('component.ext');

	while(list.length){
		name = list.shift();

		if(maps[name]){
			return name;
		}

		for(var i = 0, len = exts.length; i < len; i++){
			var tmpName = name + exts[i];

			if(maps[tmpName]){
				return tmpName;
			}
		}
	}

	return info;
}

module.exports = function(feather, opts){	
	var moduleName = feather.config.get('project.modulename');

	require('feather2-hook-components')(feather, opts);

	if(moduleName == 'common'){
		feather.on('components:info', function(info){
			var components = {};

			for(var i in info){
				components[moduleName + ':' + i] = info[i];
			}

			feather.releaseInfo.components = components;
		});
	}else if(moduleName){
		var RULE = /^(\w+:)?([0-9a-zA-Z\.\-_]+)(?:\/(.+))?\/?$/;
		var DIR = 'components';
		var componentInfo = feather.releaseInfo.components, map = feather.releaseInfo.map;

		feather.on('lookup:file', function(info, file){
			if(!info.file){
				var fullName = info.rest.replace(/:\/([^\/])/, ':$1');
	
				if(!map[fullName]){
					var match = RULE.exec(fullName);

					if(match){
						var ns = match[1] || '', cName = match[2], subpath = match[3], config = componentInfo[ns + cName] || {};
						var dir = ns + DIR + '/' + cName + '/';

						if(subpath){
							fullName = findResource(dir + subpath, map);
						}else{
							fullName = findResource(dir + (config.main || 'index'), map);

							if(!fullName){
								fullName = findResource(dir + cName, map);
							}
						}
					}
				}

				if(fullName && map[fullName]){
					var resolved = info.file = feather.file.wrap(fullName);
					resolved.url = fullName.indexOf(':') > -1 ? fullName : ('/' + fullName);
					resolved.id = fullName;
					resolved.setContent('');
					resolved.useHash = false;
					resolved.useDomain = false;
					resolved.useMap = false;
					resolved.useCompile = false;
					resolved.useCache = false;
					resolved.getUrl = function(){
						return resolved.url;
					};
					resolved.isFile = function(){
						return true;
					};
					resolved.exists = function(){
						return true;
					};

					info.rest = fullName;
				}
			}
		});
	}
};