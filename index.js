#!/usr/bin/env node
var program = require('commander');
var colors = require('colors');

program
	.version('0.1.0')
	.description('Command-line tool for syncing files over WiFi')
	.usage('TODO')
	.option('-p, --port <n>', 'Port to run/listen over. Defaults to 2323', parseInt)
;

program
	.command('start [directory]')
	.alias('s')
	.description('Start a server to sync files in the directory (default: current directory)')
	.action(function(dir, options) {
		dir = dir || __dirname;
		var port = options.port || 2323;

		// get ip address
		require('dns').lookup(require('os').hostname(), function (err, add, fam) {
			console.log('Running on '+add + ':' + port);
		});
	});

program
	.command('connect <address> [directory]')
	.alias('c')
	.description('Connect to an existing server')
	.action(function(add, dir, options){
		dir = dir || __dirname;
		var port = options.port || 2323;

		// try to get port from address
		if (add.indexOf(':') > -1) {
			var parts = add.split(':');
			add = parts[0];
			port = parseInt(parts[1]);
		}

		console.log('Connecting to ' + add + ':' + port)
	});	

program
	.command('*')
	.action(function(cmd) {
		console.log(colors.red('Command `' + cmd + '` not found.') + ' Use --help for more information');
	});

if (!process.argv.slice(2).length) {
	program.outputHelp(make_red);
}

function make_red(txt) {
	return colors.red(txt); //display the help text in red on the console
}

program.parse(process.argv);