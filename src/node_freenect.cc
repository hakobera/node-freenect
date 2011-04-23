/**
 * Node.js addon for libfreenect.
 */

//-------------------------------------------------------------------------
// Includes
//-------------------------------------------------------------------------
#include <v8.h>
#include <node.h>
#include <node_events.h>

#include <libfreenect.h>

//-------------------------------------------------------------------------
// Defines
//-------------------------------------------------------------------------
// Taken from node-usb
#define V8STR(str) String::New(str)
#define THROW_BAD_ARGS(FAIL_MSG) return ThrowException(Exception::TypeError(V8STR(FAIL_MSG)));
#define THROW_ERROR(FAIL_MSG) return ThrowException(Exception::Error(V8STR(FAIL_MSG))));
#define THROW_NOT_YET return ThrowException(Exception::Error(String::Concat(String::New(__FUNCTION__), String::New("not yet supported"))));

//-------------------------------------------------------------------------
// Freenect wrpper
//-------------------------------------------------------------------------
class v8_Freenect : node::EventEmitter
{
public:

	v8_Freenect()
	: context(NULL), device(NULL)
	{
	}

	~v8_Freenect() 
	{
	}

	/**
	 * Constructor for Node.js.
	 *
	 * @param args Constructor arguments passed from Node.js
	 * @return Freenect component for Node.js
	 */
	static v8::Handle<v8::Value> New(const v8::Arguments& args)
	{
		if (args.Length() == 0) {
			(new v8_Freenect())->Wrap(args.This());
		}
		return args.This();
	}

	/**
	 * Init Kinect configuration.
	 *
	 * @return True, if kinect initialized success.
	 */
	static v8::Handle<v8::Value> Init(const v8::Arguments& args) 
	{
		v8_Freenect* freenect = getThis(args);
		if (freenect_init(&freenect->context, NULL) < 0) {
			printf("freenect_init() failed\n");
			return v8::Boolean::New(false);
		}
		printf("freenect_init() successed.\n");
		freenect_set_log_level(freenect->context, FREENECT_LOG_DEBUG);

		int deviceNum = freenect_num_devices(freenect->context);
		printf("Number of devices found: %d\n", deviceNum);
		if (deviceNum < 1) {
			return v8::Boolean::New(false);
		}
		return v8::Boolean::New(true);
	}

	/**
	 * Open kinect.
	 */
	static v8::Handle<v8::Value> Start(const v8::Arguments& args) 
	{
		v8_Freenect* freenect = getThis(args);
		int deviceNumber = 0;
		if (freenect_open_device(freenect->context, &freenect->device, deviceNumber) < 0) {
			printf("Could not open device %d\n", deviceNumber);
			return v8::Boolean::New(false);
		}
		printf("Open device %d\n", deviceNumber);

		return v8::Boolean::New(true);
	}

	/**
	 * Set LED options.
	 *
	 * @param args Arguments list.
	 * @return true if args is valid options.
	 */
	static v8::Handle<v8::Value> SetLed(const v8::Arguments& args)
	{
    v8_Freenect* freenect = getThis(args);
	  v8::Local<v8::Value> ledOption = args[0];
    int n = ledOption->Int32Value();
    if (n < 0) {
      n = 0;
    }
    if (n > 6) {
      n = 6;
    }
		freenect_set_led(freenect->device, static_cast<freenect_led_options>(n));
	}

	/**
	 * Set tilt angle of kinect.
	 *
	 * @param args Arguments list.
	 * @return true if args is valid options.
	 */
	static v8::Handle<v8::Value> SetTiltDegs(const v8::Arguments& args)
	{
    v8_Freenect* freenect = getThis(args);
	  v8::Local<v8::Value> tiltDegs = args[0];
    int n = tiltDegs->NumberValue();
    if (n <= -30.0) {
      n = -30.0;
    }
    if (n >= 30.0) {
      n = 30.0;
    }
		freenect_set_tilt_degs(freenect->device, n);
	}

	/**
	 * Shutdown kinect.
	 */
	static v8::Handle<v8::Value> Stop(const v8::Arguments& args) 
	{
		v8_Freenect* freenect = getThis(args);
		
		if (freenect->context != NULL) {
			if (freenect->device != NULL) {
				freenect_close_device(freenect->device);
			}

			if (freenect_shutdown(freenect->context) < 0) {
				printf("freenect_shutdown() failed\n");
				return v8::Boolean::New(false);
			}
			printf("freenect_shutdown() successed\n");
		} else {
			printf("freenect context is not initialized\n");
		}
		return v8::Boolean::New(true);
	}

private:
	
	// back: owned by libfreenect (implicit for depth)
	// mid: owned by callbacks, "latest frame ready"
	// front: owned by GL, "currently being drawn"
	uint8_t* depth_mid;
	uint8_t* depth_front;
	uint8_t* rgb_back;
	uint8_t* rgb_mid;
	uint8_t* rgb_front;

	freenect_context* context;
	freenect_usb_context* usbContext;
	freenect_device* device;
	int angle;
	int led;
	
	static v8_Freenect* getThis(const v8::Arguments& args) 
	{
		v8_Freenect* freenect = static_cast<v8_Freenect*>(args.This()->GetPointerFromInternalField(0));
		return freenect;
	}

};

//-------------------------------------------------------------------------
// Node.js addon interfaces
//-------------------------------------------------------------------------

extern "C" void init(v8::Handle<v8::Object> target)
{
  v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(v8_Freenect::New);
	t->InstanceTemplate()->SetInternalFieldCount(1);
	NODE_SET_PROTOTYPE_METHOD(t, "init", v8_Freenect::Init);
	NODE_SET_PROTOTYPE_METHOD(t, "start", v8_Freenect::Start);
	NODE_SET_PROTOTYPE_METHOD(t, "stop", v8_Freenect::Stop);
	NODE_SET_PROTOTYPE_METHOD(t, "setLed", v8_Freenect::SetLed);
	NODE_SET_PROTOTYPE_METHOD(t, "setTiltDegs", v8_Freenect::SetTiltDegs);

  target->Set(v8::String::New("Freenect"), t->GetFunction());
}

