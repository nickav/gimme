var colors = require('colors');

/** The base request class for communication between sockets. */
var Request = function(method, data) {
  // constructor
  this.method = method;
  this.data = data;
  // request time might be important
};

/** Converts the request to JSON (adding padding between requests). */
Request.prototype.json = function() {
  // special delimeter
  return JSON.stringify(this) + Request.delimeter;
};

// static vars

Request.delimeter = "\n\n";

Request.methods = {
  add_file: 'add_file',
  compare_file: 'compare_file',
  remove_file: 'remove_file',
  apply_patch: 'apply_patch',
};

// static functions

/** Parses a request from the string data and returns a Request object. */
Request.parse = function(data) {
  var json;
  try {
    json = JSON.parse(data);
  } catch (e) {
    console.log(colors.red('Could not parse JSON: ' + data + '\n'));
    return false;
  } 

  // validate method
  var method = json['method'];
  if (!method in Request.methods) {
    // invalid request
    console.log(colors.red('Invalid Request Method: ' + method + '\n'));
    return false;
  }

  return new Request(method, json['data']);
};

module.exports = Request;

