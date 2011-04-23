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
        tiltDegButton = $('#tiltDegButton');

    socket.connect();

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

    socket.connect();
  });
});