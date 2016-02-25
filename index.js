#!/usr/bin/env node
var program = require('commander');
//var colors = require('colors');

program
	.version('0.1.0')
	.description('Command-line tool for syncing files over WiFi')
	.usage('TODO')
	.option('-p, --port <n>', 'Port to run/listen over. Defaults to 2323', parseInt)
	.arguments('<cmd> [directory]')
	.action(function(cmd, dir) {
		cmdValue = cmd;
		dirValue = dir;
	});

program.parse(process.argv);

if (typeof cmdValue == 'undefined') {
	console.error('no command given! use --help for more information');
	process.exit(1);
}

// default to current directory
dirValue = dirValue || __dirname;

console.log('command: ' + cmdValue);
console.log(dirValue);

