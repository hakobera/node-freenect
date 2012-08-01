(function(global) {
  var server,
      socket,
      host = 'localhost',
      port = 3000,
      connected = false,
      connectionCallback,
	    commandCallbacks = {};

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
	  if (connectionCallback) {
		  connectionCallback();
	  }
  });

  socket.on('connect_failed', function() {
    connected = false;
    console.log('Connect failed.');
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

  socket.on('message', function(command) {
	  var cmd = JSON.parse(command);
    // console.log('[callback][%s]', cmd.type);
	  if (commandCallbacks.hasOwnProperty(cmd.type)) {
		  commandCallbacks[cmd.type].call(Kinect, cmd.result);
	  };
  });

  Kinect = {

    connect: function(callback) {
	    socket.connect();
	    if (callback && typeof(callback) === 'function') {
		    connectionCallback = callback
	    }
	  },

    sendCommand: function(commandType, options) {
      if (connected) {
        var cmd = options || {};
        cmd.type = commandType
	      // console.log('[send][%s]', cmd.type, cmd);
        socket.send(JSON.stringify(cmd));
      }
    },

	  on: function(commandType, callback) {
		  if (callback && typeof(callback) === 'function') {
			  commandCallbacks[commandType] = callback;
		  }
	  },

	  setLed: function(ledOption) {
		  this.sendCommand('setLed', { option: ledOption });
	  },

	  setTiltAngle: function(angle) {
			this.sendCommand('setTiltAngle', { angle: angle });
		},

	  getDepth: function(callback) {
		  this.sendCommand('getDepth');
		  this.on('getDepth', function(ret) {
				if (callback) {
					callback.call(Kinect, ret.data);
				}
			});
	  },

	  getVideo: function(callback) {
		  this.sendCommand('getVideo');
		  this.on('getVideo', function(ret) {
				if (callback) {
					callback.call(Kinect, ret.data);
				}
			});
	  },

	  stop: function() {
		  this.sendCommand('stop');
	  }

  };

	Kinect.LED_OPTIONS = {
		OFF: 0,
		GREEN: 1,
		RED: 2,
		YELLOW: 3,
		BLINK_GREEN: 5,
		BLINK_RED_YELLOW: 6
  };

	return Kinect;
})(this);