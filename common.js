
function require(lib, callback = null){
	var script = document.createElement('script');
	script.src = 'js/' + lib + '.js';
	if(callback){
		script.onload = callback;
	}
	document.body.appendChild(script);
}

function enums(options){
	var object = {};
	for(var i = 0; i < options.length; i++){
		object[options[i]] = i;
	}
	return object;
}

function httpGet(){
	var i = location.href.indexOf('?');
	if(i <= 0){
		return {};
	}
	var query_string = location.href.substr(i + 1).split('&');
	var result  = {};
	for(var i = 0; i < query_string.length; i++){
		var pair = query_string[i].split('=');
		if(pair.length > 1){
			result[pair[0]] = pair[1];
		}
	}
	return result;
}
