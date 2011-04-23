require(
[
  '/javascripts/socket.js',
  'http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js'
],
function(socket) {
  require.ready(function() {
    var startButton = $('#start'),
        stopButton = $('#stop'),
        ledSwitch = $('input[name=led]');

    socket.connect();

    startButton.click(function() {
      socket.sendCommand('start');
    });

    stopButton.click(function() {
      socket.sendCommand('stop');
    });

    ledSwitch.click(function() {
      socket.sendCommand('setLed', { color: $(this).val() });
    });

    socket.connect();
  });
});