// enum taken from libfreenect.h

var Freenect = require('freenect_bindings');

var LED_OPTIONS = {
	OFF: 0,
	GREEN: 1,
	RED: 2,
	YELLOW: 3,
	BLINK_GREEN: 5,
	BLINK_RED_YELLOW: 6
};

exports.Kinect = Freenect.Kinect;
exports.LED_OPTIONS = LED_OPTIONS;
