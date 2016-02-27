/** The base request class for communication between sockets. */
var Request = function(method, data) {
	// constructor
	this.method = method;
	this.data = data;
};

/** Converts the request to JSON. */
Request.prototype.json = function() {
	return JSON.stringify(this);
};

Request.methods = {
	compare_files: 'compare_files',
	remove_files: 'remove_files',
	apply_patch: 'apply_patch',
};

// static functions

/** Parses a request from the string data. */
Request.parse = function(data) {
	var json = JSON.parse(data);
	var method = json['method'];
	if (Request.methods.indexOf(method) < 0) {
		// invalid request
		return false;
	}

	return new Request(method, json['data']);
};

module.exports = Request;

