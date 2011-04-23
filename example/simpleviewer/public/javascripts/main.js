require(
[
  '/javascripts/socket.js',
  'http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js'
],
function(socket) {
  require.ready(function() {
    var startButton = $('#start'),
        stopButton = $('#stop');

    socket.connect();

    startButton.click(function() {
      socket.send(JSON.stringify({ type: 'start' }));
    });

    stopButton.click(function() {
      socket.send(JSON.stringify({ type: 'stop' }));
    });

    socket.connect();
  });
});