import os
import Options, Utils
from os import unlink, symlink, chdir, popen
from os.path import exists

VERSION = '0.0.1'

def set_options(opt):
  opt.tool_options('compiler_cxx')

def configure(conf):
  conf.check_tool('compiler_cxx')
  conf.check_tool('node_addon')
  conf.check_cxx(lib = 'usb-1.0')
  conf.check_cxx(lib = 'freenect')
  conf.check_cxx(lib = 'freenect_sync')

def build(bld):
  obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
  obj.target = 'freenect_binding'
  obj.source = './src/node_freenect.cc'
  obj.includes = [ '/usr/local/include', '/usr/local/include/libfreenect' ]
  obj.lib = [ 'usb-1.0', 'freenect', 'freenect_sync' ]
  obj.name = 'node-freenect'

def shutdown():
  t = 'freenect_bindings.node'
  if exists('build/default' + t) and not exists(t):
    symlink('build/default/' + t, t)

