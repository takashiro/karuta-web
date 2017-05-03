
class Packet {

	constructor(data = null){
		this.command = 0;
		this.timeout = 0;
		this.arguments = null;
		if(data){
			this.parseBlob(data);
		}
	}

	toBlob(){
		var parts = [this.num2bit(this.command), this.num2bit(this.timeout)];
		if(this.arguments){
			var args = JSON.stringify(this.arguments);
			var encoder = new TextEncoder('utf-8');
			parts.push(encoder.encode(args));
		}
		return new Blob(parts);
	}

	parseBlob(data){
		var buffer = {
			'view' : new DataView(data, 0),
			'offset' : 0
		};
		this.command = this.bit2num(buffer);
		this.timeout = this.bit2num(buffer);
		var raw = new Uint8Array(data.slice(buffer.offset));
		var decoder = new TextDecoder('utf-8');
		var args = decoder.decode(raw);
		this.arguments = JSON.parse(args);
	}

	num2bit(value){
		if (-126 <= value && value <= 127) {
			return new Int8Array([value]);
		} else {
			if(-32768 <= value && value <= 32767){
				var arr = new Int8Array(3);
				arr[0] = 0x81;
				arr[1] = value & 0xFF;
				arr[2] = value >> 8;
				return arr;
			}else{
				var arr = new Int8Array(5);
				arr[0] = 0x80;
				for(var i = 1; i <= 4; i++){
					arr[i] = value & 0xFF;
					value >>= 8;
				}
				return arr;
			}
		}
	}

	bit2num(buffer){
		var value = buffer.view.getInt8(buffer.offset);
		buffer.offset++;
		if(value == -127){
			value = buffer.view.getInt16(buffer.offset, true);
			buffer.offset += 2;
		}else if(value == -126){
			value = buffer.ivew.getInt32(buffer.offset, true);
			buffer.offset += 4;
		}
		return value;
	}

}

class Server {

	constructor(url){
		this.setUrl(url);
		this.socket = null;
		this.onopen = [];
		this.onclose = [];
		this.onmessage = null;
	}

	setUrl(url){
		if(url){
			var absolute_path = /^\w+:\/\/.+/i;
			if(absolute_path.test(url)){
				this.url = url;
			}else{
				var domain_split = url.indexOf('/');
				var domain = '';
				var path = '';
				if(domain_split == -1){
					domain = url;
				}else{
					domain = url.substr(0, domain_split);
					path = url.substr(domain_split + 1);
				}
				if(domain.indexOf(':') >= 0){
					this.url = 'ws://' + domain + '/' + path;
				}else{
					this.url = 'ws://' + domain + ':2610/' + path;
				}
			}
		}else{
			this.url = '';
		}
	}

	connect(url){
		this.setUrl(url);
		if(!this.url){
			return false;
		}

		var server = this;
		this.socket = new WebSocket(this.url);
		this.socket.binaryType = 'arraybuffer';
		this.socket.onopen = function(){
			for(var i = 0; i < server.onopen.length; i++){
				server.onopen[i]();
			}
		};
		this.socket.onmessage = function(e){
			var packet = new Packet(e.data);
			if (server.onmessage && server.onmessage[packet.command]) {
				server.onmessage[packet.command](packet.arguments);
			}
		};
		this.socket.onclose = function(e){
			for(var i = 0; i < server.onclose.length; i++){
				server.onclose[i](e);
			}
			server.socket = null;
		};

		return true;
	}

	disconnect(){
		if(this.socket){
			this.socket.close();
			this.socket = null;
		}
	}

	get isConnected(){
		return this.socket != null;
	}

	request(command, args = null){
		var packet = new Packet;
		packet.command = command;
		packet.arguments = args;
		packet.timeout = 0;
		this.socket.send(packet.toBlob());
	}

	on(event, callback){
		switch(event){
		case 'open':
			this.onopen.push(callback);
			break;
		case 'close':
			this.onclose.push(callback);
			break;
		}
	}

	bind(command, callback){
		this.onmessage[command] = callback;
	}

};
