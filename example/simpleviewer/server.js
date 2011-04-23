var express = require('express'),
    connect = require('connect'),
    ejs = require('ejs'),
    sys = require('sys'),
    path = require('path'),
    io = require('socket.io'),
    freenect = require('../../build/default/freenect_bindings'),
    port = 3000,
    app,
    socket,
    kinect;

kinect = new freenect.Freenect();

app = express.createServer();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b]0m :response-time ms' }));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

function NotFound(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

app.get('/404', function(req, res) {
  throw new NotFound();
});

app.get('/500', function(req, res) {
   throw new Error('An expected error');
});

app.get('/bad', function(req, res) {
  unknownMethod();
});

app.error(function(err, req, res, next) {
   if (err instanceof NotFound) {
     res.render('404.ejs', { status: 404 });
   } else {
     next(err);
   }
});

if (app.settings.env === 'production') {
  app.error(function(err, req, res) {
    res.render('500.ejs', {
      status: 500,
      locals: {
        error: err
      }
    });
  });
}

app.get('/', function(req, res) {
  res.render('index.ejs');
});

var commands = {
	isConnected: function(cmd) {
		return kinect.isConnected();
	},

  start: function(cmd) {
	  var ret = kinect.init();
	  if (ret) {
		  return kinect.start();
	  }
	  return false;
  },

  stop: function(cmd) {
    return kinect.stop();
  },

  setLed: function(cmd) {
    var color = parseInt(cmd.color, 10);
    if (isNaN(color)) {
      color = 5; // BLINK GREEN
    }
    return kinect.setLed(color);
  },

	setTiltDegs: function(cmd) {
		var deg = parseFloat(cmd.degree);
		if (isNaN(deg)) {
			return false;
		}
		return kinect.setTiltDegs(deg);
	}
};

app.listen(port);
console.log('Express server listening on port %d, environment: %s', port, app.settings.env);
console.log('Using connect %s, Express %s, EJS %s', connect.version, express.version, ejs.version);

socket = io.listen(app);
socket.on('connection', function(client) {
  console.log('Connected from');
  console.log(client);

  client.on('message', function(message) {
    var command = JSON.parse(message),
        ret = {};

    console.log(command);
    if (commands.hasOwnProperty(command.type)) {
      ret.type = command.type;
	    ret.result = commands[command.type](command);
      client.send(JSON.stringify(ret));
    } else {
	    ret.type = command.type;
	    ret.result = 'Invalid command.';
	    client.send(JSON.stringify(ret));
    }
  });

  client.on('disconnect', function() {
    console.log('Disconnect %s', client);
  });
});
