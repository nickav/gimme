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

// defaults
dirValue = dirValue || __dirname;
program.port = program.port || 2323;

if (typeof cmdValue == 'undefined') {
	console.error('No command given! Use --help for more information');
	process.exit(1);
}

// commands
if (cmdValue == 'start') {
	// get ip address
	require('dns').lookup(require('os').hostname(), function (err, add, fam) {
		console.log('Running on '+add + ':' + program.port);
	});
}
else {
	console.error('Command \'' + cmdValue + '\' not recognized. Use --help for more information');
}
