$(function() {
	var rgbButton = $('#rbgButton'),
			depthButton = $('#depthButton'),
			stopButton = $('#stopButton'),
			depthCanvas = document.getElementById('depthbuffer'),
			depthContext = depthCanvas.getContext('2d'),
			// screenImage = screenContext.createImageData(screenCanvas.width, screenCanvas.height),
			depthImage = depthContext.createImageData(80, 60),
			depthSize = depthCanvas.width * depthCanvas.height,

			screenCanvas = document.getElementById('screen'),
			screenContext = screenCanvas.getContext('2d'),
			// screenImage = screenContext.createImageData(screenCanvas.width, screenCanvas.height),
			screenImage = screenContext.createImageData(400, 300),
			screenSize = screenCanvas.width * screenCanvas.height,

			ledSwitch = $('input[name=led]'),
			tiltAngleInput = $('#tiltAngleInput'),
			tiltAngleButton = $('#tiltAngleButton');

	Kinect.connect();
/*
	rgbButton.click(function(e) {
		e.preventDefault();
		Kinect.getVideo(function(data) {
			var length = data.length,
					pixels = screenImage.data,
					i, srcIndex, dstIndex;

			console.log(length);

			for (i = 0; i < screenSize; i+=4) {
				srcIndex = i * 3;
				dstIndex = i * 4;
				pixels[dstIndex  ] = data[srcIndex  ];
				pixels[dstIndex+1] = data[srcIndex+1];
				pixels[dstIndex+2] = data[srcIndex+2];
				pixels[dstIndex+3] = 255;
			}

			screenContext.putImageData(screenImage, 0, 0);
		});
	});
*/

	
	var last_frametime = 0;
	var last_fps = 0;

	var getDepthFrame = function() {

		Kinect.getDepth(function(data) {
			console.log(data);

			var offset = 0,
					length = data.length,
					pixels = depthImage.data,
					i, color;

			offset = 0;
			for (i = 0; i < length; ++i) {
				color = data[i] ;
				pixels[offset  ] = color;
				pixels[offset+1] = color;
				pixels[offset+2] = color;
				pixels[offset+3] = 255;
				offset += 4;
			}
			depthContext.putImageData(depthImage, 0, 0);
			screenContext.drawImage(depthCanvas, 0,0,depthCanvas.width,depthCanvas.height,0,0,screenCanvas.width,screenCanvas.height);

			var t =  (new Date()).getTime();
			if (last_frametime == 0)
				last_frametime = t;

			var dt = t - last_frametime;
			if( dt >0 ){
				var cfps = 1000.0 / dt;

				last_fps *= 0.5;
				last_fps += cfps*0.5;
			}

			$('#debug').text('avg. fps: '+Math.round(last_fps,3));

				last_frametime = t;
			getDepthFrame();
		});
	};

	setTimeout(function(){
		getDepthFrame();
	}, 500);

/*
	depthButton.click(function(e) {
		e.preventDefault();
		Kinect.getDepth(function(data) {
			var offset = 0,
					length = data.length,
					pixels = screenImage.data,
					scale = 255 / 2047,
					i, color;

			for (i = 0; i < length; ++i) {
				offset = 4 * i;
				color = data[i] * scale | 0;
				pixels[offset  ] = color;
				pixels[offset+1] = color;
				pixels[offset+2] = color;
				pixels[offset+3] = 255;
			}

			screenContext.putImageData(screenImage, 0, 0);
		});
	});

	stopButton.click(function(e) {
		e.preventDefault();
		Kinect.stop();
	});
*/
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

});
