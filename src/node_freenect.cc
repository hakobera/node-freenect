/**
 * Node.js addon for libfreenect.
 */

//-------------------------------------------------------------------------
// Includes
//-------------------------------------------------------------------------
#include <cstdio>
#include <cstring>
#include <cstdlib>

#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include <node_object_wrap.h>

#include <libfreenect_sync.h>

//-------------------------------------------------------------------------
// Defines
//-------------------------------------------------------------------------
// Taken from node-usb
#define V8STR(str) v8::String::New(str)
#define THROW_BAD_ARGS(FAIL_MSG) return v8::ThrowException(v8::Exception::TypeError(V8STR(FAIL_MSG)));
#define THROW_ERROR(FAIL_MSG) return v8::ThrowException(v8::Exception::Error(V8STR(FAIL_MSG))));
#define THROW_NOT_YET return v8::ThrowException(v8::Exception::Error(v8::String::Concat(v8::String::New(__FUNCTION__), v8::String::New("not yet supported"))));

#define MAX_TILT_DEGS (31.0)
#define MIN_TILT_DEGS (-31.0)
#define INVALID_TILT_DEGS (-99.0)

//-------------------------------------------------------------------------
// libfreenect wrapper for Node.js
//-------------------------------------------------------------------------
class Freenect : node::ObjectWrap
{
public:

	Freenect()
	: deviceIndex(0), videoFormat(FREENECT_VIDEO_RGB), depthFormat(FREENECT_DEPTH_11BIT)
	{
		videoBuffer = malloc(freenect_find_video_mode(FREENECT_RESOLUTION_LOW, FREENECT_VIDEO_RGB).bytes);
		depthBuffer = malloc(freenect_find_depth_mode(FREENECT_RESOLUTION_LOW, FREENECT_DEPTH_11BIT).bytes);
		tiltState = new freenect_raw_tilt_state();
		tiltAngle = GetTiltAngle();
	}

	virtual ~Freenect()
	{
		free(videoBuffer);
		free(depthBuffer);
		freenect_sync_stop();
	}

	/**
	 * Set LED option.
	 *
	 * @param option LED option to set.
	 * @return True if set tilt angle success.
	 */
	bool SetLed(freenect_led_options option)
	{
		int ret = freenect_sync_set_led(option, deviceIndex);
		if (ret < 0) {
			printf("Could set LED %d\n", option);
			return false;
		}
		ledOption = option;
		return true;
	}

	/**
	 * Set tilt angle.
	 *
	 * @param angle Tilt angle toset. Range [-30.0..30.0]
	 * @return True if set tilt angle success.
 	 */
	bool SetTiltAngle(double angle)
	{
	  double deg = angle;
		if (deg <= MIN_TILT_DEGS) {
			deg = MIN_TILT_DEGS;
		}
		if (deg >= MAX_TILT_DEGS) {
			deg = MAX_TILT_DEGS;
		}

		int ret = freenect_sync_set_tilt_degs(deg, deviceIndex);
		if (ret < 0) {
			printf("Could set tilt degs %f\n", deg);
			return false;
		}
		tiltAngle = deg;
		return true;
	}

	/**
	 * Get video or IR buffer from kinect.
	 *
	 * @return Video buffer or NULL on error.
 	 */
	void* GetVideo()
	{
		uint32_t timestamp;
		int ret = freenect_sync_get_video(&videoBuffer, &timestamp, deviceIndex, videoFormat); 
		if (ret != 0) {
			printf("Could not get video\n");	
			return NULL;
		}
		return videoBuffer;
	}
	
	/**
	 * Get depth buffer from kinect.
	 *
	 * @return Depth buffer or NULL on error.
 	 */
	void* GetDepth()
	{
		uint32_t timestamp;
		int ret = freenect_sync_get_depth(&depthBuffer, &timestamp, deviceIndex, depthFormat); 
		if (ret != 0) {
			printf("Could not get depth\n");	
			return NULL;
		}
		return depthBuffer;
	}

	/**
	 * Get tilt angle of kinect.
	 *
	 * @return Depth buffer data
	 */
	double GetTiltAngle()
	{
		int ret = freenect_sync_get_tilt_state(&tiltState, deviceIndex);
		if (ret != 0) {
			printf("Could not get tilt angle\n");
			return INVALID_TILT_DEGS;
		}
		double angle = freenect_get_tilt_degs(tiltState);
		return angle;
	}

	/**
	 * Stop conecting to kinect device.
	 */
	 void Stop()
	 {
	 	freenect_sync_stop();
	 }

	//------------------------------------------------------------------------

	//------------------------------------------------------------------------
	// Export functions.
	//------------------------------------------------------------------------

	/**
	 * Constructor for Node.js.
	 *
	 * @param args Constructor arguments passed from Node.js
	 * @return Freenect component for Node.js
	 */
	static v8::Handle<v8::Value> New(const v8::Arguments& args)
	{
		v8::HandleScope scope;

		Freenect* freenect = new Freenect();
		freenect->Wrap(args.This());
		freenect->Ref();
		return args.This();
	}

	/**
	 * Set LED options.
	 *
	 * @param args Arguments list.
	 * @return {Boolean} true if args is valid options.
	 */
	static v8::Handle<v8::Value> SetLed(const v8::Arguments& args)
	{
	  v8::HandleScope scope;

		if (args.Length() != 1) {
			THROW_BAD_ARGS("SetLed must have 1 argument.")
		}
		
		v8::Local<v8::Value> ledOption = args[0];
		if (!ledOption->IsInt32()) {
			THROW_BAD_ARGS("SetLed must have 1 int argument.")
		}

		int n = ledOption->Int32Value();
		if (n < LED_OFF) {
			n = LED_OFF;
		}
		if (n > LED_BLINK_RED_YELLOW) {
			n = LED_BLINK_RED_YELLOW;
		}

		Freenect* freenect = getThis(args);
		bool ret = freenect->SetLed(static_cast<freenect_led_options>(n));
		return v8::Boolean::New(ret);
	}

	/**
	 * Set tilt angle of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Boolean} true if args is valid options.
	 */
	static v8::Handle<v8::Value> SetTiltAngle(const v8::Arguments& args)
	{
		v8::HandleScope scope;

		if (args.Length() != 1) {
			THROW_BAD_ARGS("SetTiltAngle must have 1 argument.")
		}
		
		v8::Local<v8::Value> angle = args[0];
		if (!angle->IsNumber()) {
			THROW_BAD_ARGS("SetTiltAngle must have 1 number argument.")
		}
		
		double a = angle->NumberValue();
    
		Freenect* freenect = getThis(args);
		bool ret = freenect->SetTiltAngle(a);
		return v8::Boolean::New(ret);
	}

	/**
	 * Get RBG image of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Array.<uint32>} RGB pixel data
	 */
	static v8::Handle<v8::Value> GetVideo(const v8::Arguments& args)
	{
	  v8::HandleScope scope;

		Freenect* freenect = getThis(args);
		unsigned char* buf = static_cast<unsigned char*>(freenect->GetVideo());
		int length = freenect_find_video_mode(FREENECT_RESOLUTION_LOW, FREENECT_VIDEO_RGB).bytes;
		v8::Local<v8::Array> array = v8::Array::New(length);
		/*
		for (int i = 0; i < length; i+=16) {
			array->Set(i   , v8::Uint32::New(buf[i   ]));
			array->Set(i+1 , v8::Uint32::New(buf[i+ 1]));
			array->Set(i+2 , v8::Uint32::New(buf[i+ 2]));
			array->Set(i+3 , v8::Uint32::New(buf[i+ 3]));
			array->Set(i+4 , v8::Uint32::New(buf[i+ 4]));
			array->Set(i+5 , v8::Uint32::New(buf[i+ 5]));
			array->Set(i+6 , v8::Uint32::New(buf[i+ 6]));
			array->Set(i+7 , v8::Uint32::New(buf[i+ 7]));
			array->Set(i+8 , v8::Uint32::New(buf[i+ 8]));
			array->Set(i+9 , v8::Uint32::New(buf[i+ 9]));
			array->Set(i+10, v8::Uint32::New(buf[i+10]));
			array->Set(i+11, v8::Uint32::New(buf[i+11]));
			array->Set(i+12, v8::Uint32::New(buf[i+12]));
			array->Set(i+13, v8::Uint32::New(buf[i+13]));
			array->Set(i+14, v8::Uint32::New(buf[i+14]));
			array->Set(i+15, v8::Uint32::New(buf[i+15]));
		}
		*/
		return array;
	}

	/**
	 * Get video buffer of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Buffer} Video buffer data (RGB)
	 */
	static v8::Handle<v8::Value> GetVideoBuffer(const v8::Arguments& args)
	{
		v8::HandleScope scope;

		Freenect* freenect = getThis(args);
		char* buf = static_cast<char*>(freenect->GetVideo());
		node::Buffer* retbuf = node::Buffer::New(buf, freenect_find_video_mode(FREENECT_RESOLUTION_LOW, FREENECT_VIDEO_RGB).bytes);
		return retbuf->handle_;
	}
	
	/**
	 * Get depth buffer of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Array.<uint32>} Depth buffer data
	 */
	static v8::Handle<v8::Value> GetDepth(const v8::Arguments& args)
	{
		v8::HandleScope scope;

		Freenect* freenect = getThis(args);
		uint16_t* buf = static_cast<uint16_t*>(freenect->GetDepth());
		int length = 640*480;
		v8::Local<v8::Array> array = v8::Array::New(length);
		for (int i = 0; i < length; i+=16) {
			array->Set(i   , v8::Uint32::New(buf[i   ]));
			array->Set(i+1 , v8::Uint32::New(buf[i+ 1]));
			array->Set(i+2 , v8::Uint32::New(buf[i+ 2]));
			array->Set(i+3 , v8::Uint32::New(buf[i+ 3]));
			array->Set(i+4 , v8::Uint32::New(buf[i+ 4]));
			array->Set(i+5 , v8::Uint32::New(buf[i+ 5]));
			array->Set(i+6 , v8::Uint32::New(buf[i+ 6]));
			array->Set(i+7 , v8::Uint32::New(buf[i+ 7]));
			array->Set(i+8 , v8::Uint32::New(buf[i+ 8]));
			array->Set(i+9 , v8::Uint32::New(buf[i+ 9]));
			array->Set(i+10, v8::Uint32::New(buf[i+10]));
			array->Set(i+11, v8::Uint32::New(buf[i+11]));
			array->Set(i+12, v8::Uint32::New(buf[i+12]));
			array->Set(i+13, v8::Uint32::New(buf[i+13]));
			array->Set(i+14, v8::Uint32::New(buf[i+14]));
			array->Set(i+15, v8::Uint32::New(buf[i+15]));
		}
		return array;
	}

	/**
	 * Get depth buffer of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Buffer} Depth buffer data
	 */
	static v8::Handle<v8::Value> GetDepthBuffer(const v8::Arguments& args)
	{
		printf("entering getdepth\n");
		v8::HandleScope scope;
		Freenect* freenect = getThis(args);
		uint16_t* buf = static_cast<uint16_t*>(freenect->GetDepth());
		freenect_frame_mode mode = freenect_find_depth_mode(FREENECT_RESOLUTION_MEDIUM, FREENECT_DEPTH_11BIT);
		int length = mode.width * mode.height;
		printf("valid:%d, width:%d, height:%d, length:%d\n", mode.is_valid, mode.width, mode.height, length);
		if(!mode.is_valid)
			return v8::Boolean::New(false);
		char *buf2 = (char *)malloc(length);//[640*480] = { 0,1,2,3,4,5 };
		printf("ptr buf=0x%08X, buf2=0x%08X\n", (unsigned long)buf, (unsigned long)buf2);
		for (int i = 0; i < length; i++) {
			buf2[i] = rand()&255;//buf[i] >> 2;
		}
		node::Buffer* retbuf = node::Buffer::New(buf2, length);
		free(buf2);
		printf("leaving getdepth\n");
		return retbuf->handle_;
	}

	/**
	 * Get scaled depth buffer of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Buffer} Depth buffer data
	 */
	static v8::Handle<v8::Value> GetScaledDepthBuffer(const v8::Arguments& args)
	{

		if (args.Length() != 2) {
			THROW_BAD_ARGS("GetScaledDepthBuffer must have 2 arguments.")
		}
		
		v8::Local<v8::Value> w_param = args[0];
		v8::Local<v8::Value> h_param = args[1];
		if (!w_param->IsNumber() && !h_param->IsNumber()) {
			THROW_BAD_ARGS("SetTiltAngle must have 2 number argument.")
		}
		
		int outputwidth = (int)w_param->NumberValue();
		int outputheight = (int)h_param->NumberValue();

		v8::HandleScope scope;
		Freenect* freenect = getThis(args);
		uint16_t* buf = static_cast<uint16_t*>(freenect->GetDepth());
		freenect_frame_mode mode = freenect_find_depth_mode(FREENECT_RESOLUTION_MEDIUM, FREENECT_DEPTH_11BIT);
		int length = mode.width * mode.height;
		int outputlength = outputwidth * outputheight;
		printf("valid:%d, width:%d (%d), height:%d (%d), length:%d\n", mode.is_valid, mode.width, outputwidth, mode.height, outputheight, length);
		char *buf2 = (char *)malloc(length);//[640*480] = { 0,1,2,3,4,5 };
		char *buf3 = (char *)malloc(outputlength);//[640*480] = { 0,1,2,3,4,5 };
		printf("ptr buf=0x%08X, buf2=0x%08X\n", (unsigned long)buf, (unsigned long)buf2);

		// scale to bytes
		for (int i = 0; i < length; i++) {
			buf2[i] = buf[i] >> 2;
		}

		// ugly downscaler

		int oo = 0;
		int istride = mode.width;
		for(int j=0; j<outputheight; j++) {
			int iy = (j * mode.height) / outputheight;
			for(int i=0; i<outputwidth; i++) {
				int ix = (i * mode.width) / outputwidth;
				int s = buf2[iy * istride + ix];
				buf3[oo++] = s;
			}
		}

		node::Buffer* retbuf = node::Buffer::New(buf3, outputlength);
		free(buf2);
		free(buf3);
		printf("leaving getdepth\n");
		return retbuf->handle_;
	}

	/**
	 * Get tilt angle of kinect.
	 *
	 * @param args Arguments list.
	 * @return {Number} Depth buffer data
	 */
	static v8::Handle<v8::Value> GetTiltAngle(const v8::Arguments& args)
	{
	  v8::HandleScope scope;

		Freenect* freenect = getThis(args);
		double angle = freenect->GetTiltAngle();
		return v8::Number::New(angle);
	}

	/**
	 * Stop connecting to kinect.
	 *
	 * @param args Arguments list.
	 * @return {undefined}
	 */
	static v8::Handle<v8::Value> Stop(const v8::Arguments& args)
	{
		v8::HandleScope scope;

		Freenect* freenect = getThis(args);
		freenect->Stop();
		return v8::Undefined();
	}

private:
	int deviceIndex;
	double tiltAngle;

	freenect_led_options ledOption;
	freenect_raw_tilt_state* tiltState;
	freenect_video_format videoFormat;
	freenect_depth_format depthFormat;

	void* videoBuffer;
	void* depthBuffer;

	/**
	 * Get this pointer from v8::Arguments.
	 */
	static Freenect* getThis(const v8::Arguments& args)
	{
		Freenect* freenect = ObjectWrap::Unwrap<Freenect>(args.This());
		return freenect;
	}

};

//-------------------------------------------------------------------------
// Node.js addon interfaces
//-------------------------------------------------------------------------

extern "C" void init(v8::Handle<v8::Object> target)
{
	v8::HandleScope scope;

  v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(Freenect::New);
	t->InstanceTemplate()->SetInternalFieldCount(1);
	NODE_SET_PROTOTYPE_METHOD(t, "setLed", Freenect::SetLed);
	NODE_SET_PROTOTYPE_METHOD(t, "setTiltAngle", Freenect::SetTiltAngle);
	NODE_SET_PROTOTYPE_METHOD(t, "getTiltAngle", Freenect::GetTiltAngle);
	NODE_SET_PROTOTYPE_METHOD(t, "getVideo", Freenect::GetVideo);
	NODE_SET_PROTOTYPE_METHOD(t, "getVideoBuffer", Freenect::GetVideoBuffer);
	NODE_SET_PROTOTYPE_METHOD(t, "getDepth", Freenect::GetDepth);
	NODE_SET_PROTOTYPE_METHOD(t, "getDepthBuffer", Freenect::GetDepthBuffer);
	NODE_SET_PROTOTYPE_METHOD(t, "getScaledDepthBuffer", Freenect::GetScaledDepthBuffer);
	NODE_SET_PROTOTYPE_METHOD(t, "stop", Freenect::Stop);
  target->Set(v8::String::New("Kinect"), t->GetFunction());
}



