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
    dir = dir || '.';
    var port = options.port || 2323;

    app.initServer('0.0.0.0', port, dir);
  });

program
  .command('connect <address> [directory]')
  .alias('c')
  .description('Connect to an existing server. <address> can be a full ip address or the last number over WiFi')
  .action(function(add, dir, options){
    dir = dir || '.';
    var port = options.port || 2323;

    // try to get port from address
    if (add.indexOf(':') > -1) {
      var parts = add.split(':');
      port = parseInt(parts.pop());
      add = parts.join(':');
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
