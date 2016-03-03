var net = require('net')

var env = require('./env')
var MockConnection = require('./MockConnection')
var Carbon = require('../../lib/carbon')

var portrange = 45032

function getPort(cb) {
  var port = portrange
  portrange += 1

  var server = net.createServer()
  server.listen(port, function (err) {
    server.once('close', function () {
      cb(port)
    })
    server.close()
  })
  server.on('error', function (err) {
    getPort(cb)
  })
}

module.exports = {
  getPort: getPort,
  /** Runs after the function is invoked, not after it's completed. */
  after: function(obj, prop, cb) {
    var save = obj[prop]
    obj[prop] = function() {
      save.apply(this, arguments)
      //var args = arguments
      setTimeout(function(){cb.apply(obj, null)}, 0)
    }
  },
  /** Builds two Carbon instances from the file maps. */
  build: function(files1, files2) {
    var env1 = env.create(files1);
    var env2 = env.create(files2);

    var server = new MockConnection.Server();
    var client = new MockConnection.Client().connect(server);
    return [new Carbon(server, env1), new Carbon(client, env2)];
  }
};
