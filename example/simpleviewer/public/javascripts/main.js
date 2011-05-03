$(function() {
	var startButton = $('#startButton'),
			stopButton = $('#stopButton'),
			ledSwitch = $('input[name=led]'),
			tiltDegInput = $('#tiltDegInput'),
			tiltDegButton = $('#tiltDegButton'),
			statusLabel = $('#statusLabel'),
			connected = false,
			eventTimer;

	Kinect.connect();

	ledSwitch.click(function(e) {
		Kinect.setLed($(this).val());
	});

	tiltDegButton.click(function(e) {
		e.preventDefault();
		var angle = parseFloat(tiltDegInput.val());
		if (!isNaN(angle)) {
			Kinect.setTiltAngle(angle);
		}
	});
});
