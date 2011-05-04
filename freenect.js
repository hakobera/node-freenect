// require the c++ bindings & export to javascript
var binding = require(__dirname + '/build/default/freenect_binding');

var LedOptions = {
	OFF: 0,
	GREEN: 1,
	RED: 2,
	YELLOW: 3,
	BLINK_GREEN: 5,
	BLINK_RED_YELLOW: 6
};

module.exports = {
	Kinect: binding.Kinect,
	LedOptions: LedOptions
};
