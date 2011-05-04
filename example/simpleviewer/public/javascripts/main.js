$(function() {
	var rgbButton = $('#rbgButton'),
			depthButton = $('#depthButton'),
			stopButton = $('#stopButton'),
			screenCanvas = document.getElementById('screen'),
			screenContext = screenCanvas.getContext('2d'),
			screenImage = screenContext.createImageData(screenCanvas.width, screenCanvas.height),
			screenSize = screenCanvas.width * screenCanvas.height,
			ledSwitch = $('input[name=led]'),
			tiltAngleInput = $('#tiltAngleInput'),
			tiltAngleButton = $('#tiltAngleButton');

	Kinect.connect();

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
