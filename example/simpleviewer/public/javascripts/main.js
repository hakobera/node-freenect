require(
[
  '/javascripts/socket.js',
  'http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js'
],
function(socket) {
  require.ready(function() {
    var startButton = $('#startButton'),
        stopButton = $('#stopButton'),
        ledSwitch = $('input[name=led]'),
        tiltDegInput = $('#tiltDegInput'),
        tiltDegButton = $('#tiltDegButton'),
	      statusLabel = $('#statusLabel'),
	      connected = false;

    startButton.click(function(e) {
	    e.preventDefault();
      socket.sendCommand('start');
    });

    stopButton.click(function(e) {
      e.preventDefault();
	    socket.sendCommand('stop');
    });

    ledSwitch.click(function(e) {
	    socket.sendCommand('setLed', { color: $(this).val() });
    });

	  tiltDegButton.click(function(e) {
	    e.preventDefault();
		  var degs
		  socket.sendCommand('setTiltDegs', { degree: parseFloat(tiltDegInput.val()) });
	  });

	  socket.on('isConnected', function(cmd) {
		  var status = 'Not connected';
		  console.log(cmd);
		  if (cmd.result === true) {
			  status = 'Connected';
			  connected = true;
		  } else {
			  connected = false;
		  }
		  statusLabel.text(status);
	  });

	  socket.on('start', function() {
		  socket.sendCommand('isConnected');
	  });

	  socket.on('stop', function() {
		  socket.sendCommand('isConnected');
	  });

    socket.connect(function() {
	    socket.sendCommand('isConnected');
    });

  });
});