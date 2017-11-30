
(() => {
	const $_MODULE = {};

	window.ScriptLoader = document.body;

	window.LoadScript = (lib, callback = null) => {
		let onload = () => {
			$_MODULE[lib] && $_MODULE[lib]();
			callback && callback(true);
		};

		if (!$_MODULE.hasOwnProperty(lib)) {
			let script = document.createElement('script');
			script.src = 'js/' + lib + '.js';
			script.onload = onload;
			script.onerror = () => {
				alert('Failed to load ' + lib);
				callback(false);
			};
			$_MODULE[lib] = null;
			ScriptLoader.appendChild(script);
		} else {
			setTimeout(onload, 0);
		}
	};

	window.DeclareModule = (lib, func) => {
		$_MODULE[lib] = func;
	};
})();

function DeclareEnum(){
	var object = {};
	for(let i = 0; i < arguments.length; i++){
		object[arguments[i]] = i;
	}
	return object;
}

function DeclareCommand(){
	var commands = [
		'Invalid',

		'CheckVersion',

		'Login',
		'Logout',

		'RequestRoomId',
		'RequestUserId',

		'CreateRoom',
		'EnterRoom',
		'UpdateRoom',

		'SetUserList',
		'AddUser',
		'RemoveUser',

		'Speak',
		'StartGame',

		'NetworkCommandCount'
	];

	for (let command of arguments) {
		commands.push(command);
	}

	return DeclareEnum.apply(null, commands);
}

function MakeToast(data){
	if(typeof data == 'string'){
		data = {
			'message' : data,
			'url_forward' : ''
		};
	}

	var toast = $('<div class="toast"></div>');
	toast.html(data.message);
	toast.appendTo($('body'));

	toast.css({
		'top' : ($(window).height() - toast.outerHeight()) / 2,
		'left' : ($(window).width() - toast.outerWidth()) / 2
	});
	toast.animate({
		top : '-=40px',
		opacity : 1
	}, 300);

	setTimeout(function(){
		toast.fadeOut(500, function(){
			toast.remove();
			if(data.url_forward){
				if(data.url_forward == 'refresh'){
					location.reload();
				}else if(data.url_forward == 'back'){
					toast.remove();
				}else{
					location.href = data.url_forward;
				}
			}
		});
	}, 1500);
}

function HttpGet(){
	var i = location.href.indexOf('?');
	if(i <= 0){
		return {};
	}
	var query_string = location.href.substr(i + 1).split('&');
	var result  = {};
	for(let i = 0; i < query_string.length; i++){
		let pair = query_string[i].split('=');
		if(pair.length > 1){
			result[pair[0]] = pair[1];
		}
	}
	return result;
}

const $_GET = HttpGet();
