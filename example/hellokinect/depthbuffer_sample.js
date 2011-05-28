var Freenect = require('freenect');

var kinect = new Freenect.Kinect(),
		ledOption = 0,
		prev = Date.now();

setInterval(function() {
	var now = Date.now(),
			interval = now - prev,
			depth = kinect.getDepthBuffer(),
			len = depth.length,
			tiltAngle = kinect.getTiltAngle(),
			i;

	console.log('Interval: %d, Depth Size: %d, LED Option: %d, Tile Angle: %d',
							interval, len, ledOption, tiltAngle);

	// Manupulate depth pixel data like following code.
	for (i = 0; i < len; ++i) {
		depth[i] = 255 - depth[i];
	}

	// Change LED color and blink pattern.
	kinect.setLed(ledOption);

	ledOption += 1;
	if (ledOption > 6) {
		ledOption = 0
	}

	prev = now;

}, 100);
