define(
[
  '/javascripts/socket.io.js'
],
function() {
  var server,
      socket,
      socketWrapper,
      host = 'localhost',
      port = 3000,
      connected = false;

  socket = new io.Socket(host, {
    port: port,
    connectTimeout: 10000,
    reconnect: true
  });

  socket.on('connecting', function(transportType) {
    connected = false;
    console.log('Connecting to %s:%d using %s', host, port, transportType);
  });

  socket.on('connect', function() {
    connected = true;
    console.log('Connected to %s:%d', host, port);
  });

  socket.on('connect_failed', function() {
    connected = false;
    console.log('Connect filed.');
  });

  socket.on('close', function() {
    connected = false;
    console.log('Connection closed.');
  });

  socket.on('disconnect', function() {
    connected = false;
    console.log('Connection disconnected.');
  });

  socket.on('recconect', function(transportType, reconnectionAttempts) {
    connected = true;
    console.log('Reconnecting to %s:%d using %s %s', host, port, transportType, reconnectionAttempts);
  });

  socket.on('reconnect_failed', function() {
    connected = false;
    console.log('Reconnect failed.');
  });

  socket.on('message', function(message) {
    console.log(message);
  });

  socketWrapper = {
    isConnected: function() {
      return connected;
    },

    connect: function() {
      socket.connect();
    },

    sendCommand: function(commandType, options) {
      if (connected) {
        var cmd = options || {};
        cmd.type = commandType
        socket.send(JSON.stringify(cmd));
      }
    }
  };

  return socketWrapper;
});