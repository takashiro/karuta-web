
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
