freenect = require('../../build/default/freenect_bindings');
var kinect = new freenect.Freenect();
kinect.init();
kinect.start();
kinect.stop();
