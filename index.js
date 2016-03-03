#!/usr/bin/env node
var program = require('commander');
var colors = require('colors');
var app = require('./lib/index.js');

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

    app.initServer('localhost', port, dir);
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

    app.initClient(add, port, dir);
  }); 

program
  .command('*')
  .action(function(cmd) {
    console.log(colors.red('Command `' + cmd + '` not found.'));
    program.outputHelp();
  });

if (!process.argv.slice(2).length) {
  program.outputHelp(make_red);
}

function make_red(txt) {
  return colors.red(txt);
}

program.parse(process.argv);
