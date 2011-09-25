/*
 * Copyright (C) 2006, José Coelho (jose.alberto.coelho@gmail.com)
 * This program is free software; you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
 * Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if not,
 * write to the Free Software Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 *
 */

/*
 * Version 1.0
 */

function URL() {
	this.location = null;
	this.autoRedirect = true;
	this.outputFile = null;
	this.postData = null;
	this.response = null;
	this.responseData = null;
	this.result = null;
	this.headers = null;
	
	this._submit = null;
	this._oldURL = null;
	this._compression = true;
	this._path = '/usr/bin/curl ';
	this._outpath = '/tmp/' + widget.identifier;
	_self = this;
	
	this.parseHeaders = function(status,outpath) {
		if (status) {
			this.result = "Could not load URL";
			return 1;
		}
		
		this.result = this.readFile(outpath+'.html.txt');
		
		var headers = this.readFile(outpath+'.headers.txt');
		var aux = headers.match(/^HTTP/mg)

		if (aux) {
			// only one header on file
			if (aux.length == 1) {
				headers = headers.substr(0, headers.length - 4);
				headers = headers.split("\n");
			}
			else {
				// one substr don't work...
				headers = headers.substr(headers.lastIndexOf('HTTP'), headers.length);
				headers = headers.substr(0, headers.length - 4);
				headers = headers.split("\n");
			}
			
			// Clear old headers
			this.headers = new Object();
			
			// Parse header file
			for (var i=1; i < headers.length; i++) {
				aux = headers[i].split(": ");
				_self.headers[ aux[0] ] = aux[1];
			}
			
			// Parse server response
			aux = headers[0].split(" ");
			this.response = aux[1];
			this.responseData = aux[2];	
			
			if (_self.outputFile) {
				widget.system('/bin/cp -f ' + _self._outpath + '.html.txt ' + this.outputFile , null);
				this.outputFile = null;
			}
		}
		else {
			alert("ERROR: Could not parse headers");
		}
		
		// remove old tmp files used
		_self.removeTemporary();
	}
	
	this.readFile = function(filename) {
		req = new XMLHttpRequest(); 
		req.open("GET", 'file://'+filename, false); 
		req.send(null); 
		response = req.responseText; 
		if (response) { 
			return response; 
		}
		else return "Could not load file";
	}
	
	this.removeCookies = function() {
		// Remove cookies 
		widget.system('/bin/rm -f '+_self._outpath+'.cookies.txt', null);
	}
	
	this.removeTemporary = function() {
		widget.system('/bin/rm -f '+_self._outpath+'.html.txt', null);
		widget.system('/bin/rm -f '+_self._outpath+'.headers.txt', null);
	}
	
	this.fetchData = function(url, handler) {
		this.async = function() {
			_self.parseHeaders(result.status, outpath);
			handler(_self);
		}
		
		this.cancel = function() { if (result.cancel) result.cancel(); }
		
		if (window.widget) {
			var path = _self._path;
			var outpath = _self._outpath;
			
			if (url) { _self.location = url; }
			
			var command = path;
			
			// compression check
			if (_self.compression) {
				command += "--compressed ";
			}
			
			// set referer
			if (_self._oldURL) {
				command += '-e "' + _self._oldURL + '" ';
			}
			_self._oldURL = _self.location;
			
			// automatic cookie handler
			command += '-b ' + outpath + '.cookies.txt' + ' -c ' + outpath + '.cookies.txt ';
			
			// check for user headers
			if (_self._submit) {
				command += _self._submit;
				_self._submit = null; // clear user selection
			}
			
			// if exists something to post, lets do it
			command += ( _self.postData ? '-d "' + _self.postData + '" ' : '');
			_self.postData = null;
			
			// redirect if actived
			command += ( _self.autoRedirect ? '-L ' : '');
			
			// store cookies
			command += '-D' + outpath + '.headers.txt ';
			
			// output file
			command += '-o ' + outpath + '.html.txt ' + '"' + _self.location + '"';

			var result = widget.system(command, (handler ? this.async : null));

			if (!handler) {
				this.parseHeaders(result.status, outpath);
				return 0;
			}
		}
	}	
}

URL.prototype.noCompression = function() {
	this.compression = false;
}

URL.prototype.fetch = function(url) {
	return this.fetchData(url,null);
}

URL.prototype.fetchAsync = function(handler) {
	return this.fetchData(null, handler)
}

URL.prototype.getResponseHeaders = function(name){
	if (name == '*')
		return _self.headers;
	else 
		return _self.headers[name];
}

URL.prototype.setRequestHeader = function(name, value) {
	var header = '-H "' + name + ': ' + value + '" ';
	if (!this._submit) {
		this._submit = header;
	} else
		this._submit += header;
}

URL.prototype.cancel = function() {
	return this.fetchData.cancel();
}

URL.prototype.clear = function() {
	// cancel any peding request
	//_self.fetchData.cancel();
	
	// remove cookies
	this.removeCookies();
	
	// remove old data
	this.removeTemporary();
	
	this.location = null;
	this.autoRedirect = null;
	this.outputFile = null;
	this.postData = null;
	this.response = null;
	this.responseData = null;
	this.result = null;
	this.headers = new Object;
}
