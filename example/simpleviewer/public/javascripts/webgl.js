$(function() {

	var depthCanvas = document.getElementById('depthbuffer'),
			depthContext = depthCanvas.getContext('2d'),
			depthImage = depthContext.createImageData(80, 60),
			depthSize = depthCanvas.width * depthCanvas.height,

			screenCanvas = document.getElementById('screen'),
			screenContext = screenCanvas.getContext('2d'),
			screenImage = screenContext.createImageData(400, 300),
			screenSize = screenCanvas.width * screenCanvas.height;

	Kinect.connect();

	var last_frametime = 0;
	var last_fps = 0;

	var getDepthFrame = function() {

		Kinect.getDepth(function(data) {
			// console.log(data);

			var offset = 0,
					length = data.length,
					pixels = depthImage.data,
					i, color;

			offset = 0;
			for (i = 0; i < length; ++i) {
				color = data[i];
				if (color < 5) color = 255;
				pixels[offset  ] = color;
				pixels[offset+1] = color;
				pixels[offset+2] = color;
				pixels[offset+3] = 255;
				offset += 4;
			}
			depthContext.putImageData(depthImage, 0, 0);
			screenContext.drawImage(depthCanvas, 0,0,depthCanvas.width,depthCanvas.height,0,0,screenCanvas.width,screenCanvas.height);
			updateBlockZ();

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






	var container, stats;
	var camera, scene, projector, renderer;
	var objects = [], plane;

	var delta = 0.01;


	var gridwidth = 38;
	var gridheight = 24;
	var gridlength = gridwidth * gridheight;

	var objectspacing = 40;

	var mouse = new THREE.Vector2(),
		offset = new THREE.Vector3(),
		INTERSECTED,
		SELECTED;

	var halfWidth, halfHeight;














	function init() {

		var halfWidth = window.innerWidth / 2;
		var halfHeight = window.innerHeight / 2;

		container = document.getElementById('webgl');

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;
		camera.position.x = 0;
		scene.add( camera );

		scene.add( new THREE.AmbientLight( 0x505050 ) );

		var light = new THREE.SpotLight( 0xffffff, 1 );
		light.position.set( -1000, 800, 2500 );
		light.castShadow = true;
		light.shadowCameraNear = 200;
		light.shadowCameraFar = camera.far;
		light.shadowCameraFov = 50;
		light.shadowBias = -0.00022;
		light.shadowDarkness = 0.8;
		light.shadowMapWidth = 512;
		light.shadowMapHeight = 512;

		scene.add( light );

		var geometry = new THREE.CubeGeometry( objectspacing*0.8, objectspacing*0.8, 800 );

		for ( var i = 0; i < gridlength; i ++ ) {

		//	var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
			var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xffffff } ) );

			object.material.ambient = object.material.color;

			var row = Math.floor( i / gridwidth );
			var col = Math.floor( i % gridwidth );

			object.position.x = -objectspacing * (col - (gridwidth-1)/2);
			object.position.y = -objectspacing * (row - (gridheight-1)/2);
			object.position.z = 0;

			object.rotation.x = 0;// ( Math.random() * 360 ) * Math.PI / 180;
			object.rotation.y = 0;// ( Math.random() * 360 ) * Math.PI / 180;
			object.rotation.z = 0;// ( Math.random() * 360 ) * Math.PI / 180;

			object.castShadow = true;
			object.receiveShadow = true;

			scene.add( object );

			objects.push( object );

		}

	//	plane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
	//	plane.lookAt( camera.position );
	//	plane.visible = false;
	//	scene.add( plane );

		projector = new THREE.Projector();

		renderer = new THREE.WebGLRenderer( { antialias: false } );
		renderer.sortObjects = false;
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = false;

		var shaderVignette = THREE.ShaderExtras[ "vignette" ];
		var effectVignette = new THREE.ShaderPass( shaderVignette );
		effectVignette.uniforms[ "offset" ].value = 0.95;
		effectVignette.uniforms[ "darkness" ].value = 1.6;

		var effectHBlur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalBlur" ] );
		var effectVBlur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalBlur" ] );
		effectHBlur.uniforms[ 'h' ].value = 2 / ( window.innerWidth/2 );
		effectVBlur.uniforms[ 'v' ].value = 2 / ( window.innerHeight/2 );

		var effectDotScreen = new THREE.DotScreenPass( new THREE.Vector2( 0, 0 ), 0.1, 0.8 );

		var rtWidth  = window.innerWidth;
		var rtHeight = window.innerHeight;
		rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: true };

		var renderModel = new THREE.RenderPass( scene, camera );
		composer1 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );
		composer1.addPass( renderModel );
 		composer1.addPass( effectVignette );
		composer1.addPass( effectDotScreen );
		effectDotScreen.renderToScreen = true;
		// effectVignette.renderToScreen = true;
		// renderModel.renderToScreen = true;

		container.appendChild( renderer.domElement );

		// stats = new Stats();
		// stats.domElement.style.position = 'absolute';
		// stats.domElement.style.top = '0px';
		// container.appendChild( stats.domElement );
	}

	function animate() {
		requestAnimationFrame( animate );
		render();
		// stats.update();
	}

	function updateBlockZ() {
		// renderer.render( delta );

		var pixels = depthImage.data;
		for ( var i = 0; i < gridlength; i ++ ) {

			var row = Math.floor( i / gridwidth );
			var col = Math.floor( i % gridwidth );

			var object = objects[i];

			var px = Math.round(col * depthImage.width / gridwidth);
			var py = Math.round(row * depthImage.height / gridheight);

			var pixel = pixels[(py*depthImage.width+px)*4];
			if( pixel == 0 )
				pixel = 255;

			object.position.z = -((pixel-128)*5) - 400;

//			object.rotation.x += delta;
	//		object.rotation.y += delta*(i+50)/100;
		//	object.rotation.z += delta*i/100;
		}
	}

	function render() {
		renderer.clear();
		composer1.render( delta );


	}




	setTimeout(function(){
		getDepthFrame();
			init();
			animate();
	}, 500);


});
