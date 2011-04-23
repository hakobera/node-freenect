var Freenect = require('./build/default/nodefreenect').Freenect;
var f = new Freenect();
f.init();
f.start();
f.stop();
