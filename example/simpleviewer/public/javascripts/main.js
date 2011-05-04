$(function() {
	var startButton = $('#startButton'),
			stopButton = $('#stopButton'),
			ledSwitch = $('input[name=led]'),
			tiltAngleInput = $('#tiltAngleInput'),
			tiltAngleButton = $('#tiltAngleButton'),
			stopButton = $('#stopButton'),
			eventTimer;

	Kinect.connect();

	ledSwitch.click(function(e) {
		Kinect.setLed($(this).val());
	});

	tiltAngleButton.click(function(e) {
		e.preventDefault();
		var v = tiltAngleInput.val(),
				angle = parseFloat(v);
		if (!isNaN(angle)) {
			Kinect.setTiltAngle(angle);
		}
	});

	stopButton.click(function(e) {
		e.preventDefault();
			Kinect.stop();
	});
});
