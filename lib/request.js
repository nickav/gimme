var colors = require('colors');

/** The base request class for communication between sockets. */
var Request = function(method, data) {
	// constructor
	this.method = method;
	this.data = data;
};

Request.delimeter = "\n\n";

/** Converts the request to JSON. */
Request.prototype.json = function() {
	// special delimeter
	return JSON.stringify(this) + Request.delimeter;
};

Request.methods = {
	compare_files: 'compare_files',
	remove_files: 'remove_files',
	apply_patch: 'apply_patch',
};

// static functions

Request.create = function(method, data) {
	return new Request(method, JSON.stringify(data));
};

/** Parses a request from the string data and returns a Request. */
Request.parse = function(data) {
	var json;
	try {
		json = JSON.parse(data);
	} catch (e) {
		console.log(colors.red('Could not parse JSON: ' + data + '\n'));
		return false;
	}	

	var method = json['method'];
	if (!method in Request.methods) {
		// invalid request
		console.log(colors.red('Invalid Request Method: ' + method + '\n'));
		return false;
	}

	return new Request(method, JSON.parse(json['data']));
};

function escapeJSON(str) {
	return str.replace(/\\n/g, "\\n")
		.replace(/\\'/g, "\\'")
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, "\\&")
		.replace(/\\r/g, "\\r")
		.replace(/\\t/g, "\\t")
		.replace(/\\b/g, "\\b")
		.replace(/\\f/g, "\\f");
}

module.exports = Request;

