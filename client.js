
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
		let parts = [this.num2bit(this.command), this.num2bit(this.timeout)];
		if(this.arguments){
			let args = JSON.stringify(this.arguments);
			let encoder = new TextEncoder('utf-8');
			parts.push(encoder.encode(args));
		}
		return new Blob(parts);
	}

	parseBlob(data){
		let buffer = {
			'view' : new DataView(data, 0),
			'offset' : 0
		};
		this.command = this.bit2num(buffer);
		this.timeout = this.bit2num(buffer);
		let raw = new Uint8Array(data.slice(buffer.offset));
		let decoder = new TextDecoder('utf-8');
		let args = decoder.decode(raw);
		this.arguments = JSON.parse(args);
	}

	num2bit(value){
		if (-126 <= value && value <= 127) {
			return new Int8Array([value]);
		} else {
			if(-32768 <= value && value <= 32767){
				let arr = new Int8Array(3);
				arr[0] = 0x81;
				arr[1] = value & 0xFF;
				arr[2] = value >> 8;
				return arr;
			}else{
				let arr = new Int8Array(5);
				arr[0] = 0x80;
				for(let i = 1; i <= 4; i++){
					arr[i] = value & 0xFF;
					value >>= 8;
				}
				return arr;
			}
		}
	}

	bit2num(buffer){
		let value = buffer.view.getInt8(buffer.offset);
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

class Client {

	constructor(url){
		this.setUrl(url);
		this.socket = null;
		this.onopen = [];
		this.onclose = [];
		this.onmessage = {};
	}

	setUrl(url){
		if(url){
			let absolute_path = /^\w+:\/\/.+/i;
			if(absolute_path.test(url)){
				this.url = url;
			}else{
				let domain_split = url.indexOf('/');
				let domain = '';
				let path = '';
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

		this.socket = new WebSocket(this.url);
		this.socket.binaryType = 'arraybuffer';
		this.socket.onopen = () => {
			for(let i = 0; i < this.onopen.length; i++){
				this.onopen[i]();
			}
		};
		this.socket.onmessage = e => {
			let packet = new Packet(e.data);
			if (this.onmessage && this.onmessage[packet.command]) {
				this.onmessage[packet.command](packet.arguments);
			}
		};
		this.socket.onclose = e => {
			for(let i = 0; i < this.onclose.length; i++){
				this.onclose[i](e);
			}
			this.socket = null;
		};

		return true;
	}

	disconnect(){
		if(this.socket){
			this.socket.close();
			this.socket = null;
		}
	}

	get connected(){
		return this.socket && this.socket.readyState == WebSocket.OPEN;
	}

	get state(){
		if (this.socket) {
			return this.socket.readyState;
		} else {
			return WebSocket.CONNECTING;
		}
	}

	request(command, args = null){
		let packet = new Packet;
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
