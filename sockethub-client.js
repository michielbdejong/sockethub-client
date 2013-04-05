
/**
 * almond 0.1.4 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond", function(){});

define('sockethub/extend',[], function() {
  function extend(target) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      for(var key in source) {
        if(typeof(source[key]) === 'object' &&
           typeof(target[key]) === 'object') {
          extend(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    });
    return target;
  }

  return extend;
});
(function() {
  function getPromise(builder) {
    var promise;

    if(typeof(builder) === 'function') {
      setTimeout(function() {
        try {
          builder(promise);
        } catch(e) {
          promise.reject(e);
        }
      }, 0);
    }

    var consumers = [], success, result;

    function notifyConsumer(consumer) {
      if(success) {
        var nextValue;
        if(consumer.fulfilled) {
          try {
            nextValue = [consumer.fulfilled.apply(null, result)];
          } catch(exc) {
            consumer.promise.reject(exc);
            return;
          }
        } else {
          nextValue = result;
        }
        if(nextValue[0] && typeof(nextValue[0].then) === 'function') {
          nextValue[0].then(consumer.promise.fulfill, consumer.promise.reject);
        } else {
          consumer.promise.fulfill.apply(null, nextValue);
        }
      } else {
        if(consumer.rejected) {
          var ret;
          try {
            ret = consumer.rejected.apply(null, result);
          } catch(exc) {
            consumer.promise.reject(exc);
            return;
          }
          if(ret && typeof(ret.then) === 'function') {
            ret.then(consumer.promise.fulfill, consumer.promise.reject);
          } else {
            consumer.promise.fulfill(ret);
          }
        } else {
          consumer.promise.reject.apply(null, result);
        }
      }
    }

    function resolve(succ, res) {
      if(result) {
        console.log("WARNING: Can't resolve promise, already resolved!");
        return;
      }
      success = succ;
      result = Array.prototype.slice.call(res);
      setTimeout(function() {
        var cl = consumers.length;
        if(cl === 0 && (! success)) {
          // console.error("Possibly uncaught error: ", result);
        }
        for(var i=0;i<cl;i++) {
          notifyConsumer(consumers[i]);
        }
        consumers = undefined;
      }, 0);
    }

    promise = {

      then: function(fulfilled, rejected) {
        var consumer = {
          fulfilled: typeof(fulfilled) === 'function' ? fulfilled : undefined,
          rejected: typeof(rejected) === 'function' ? rejected : undefined,
          promise: getPromise()
        };
        if(result) {
          setTimeout(function() {
            notifyConsumer(consumer)
          }, 0);
        } else {
          consumers.push(consumer);
        }
        return consumer.promise;
      },

      fulfill: function() {
        resolve(true, arguments);
        return this;
      },
      
      reject: function() {
        resolve(false, arguments);
        return this;
      }
      
    };

    return promise;
  };

  if(typeof(module) !== 'undefined') {
    module.exports = getPromise;
  } else if(typeof(define) === 'function') {
    define('vendor/promising',[], function() { return getPromise; });
  } else if(typeof(window) !== 'undefined') {
    window.promising = getPromise;
  }

})();

define('sockethub/event_handling',[], function() {

  var methods = {
    /**
     * Method: on
     *
     * Install an event handler for the given event name.
     */
    on: function(eventName, handler) {
      this._validateEvent(eventName);
      this._handlers[eventName].push(handler);
    },

    _emit: function(eventName) {
      this._validateEvent(eventName);
      var args = Array.prototype.slice.call(arguments, 1);
      this._handlers[eventName].forEach(function(handler) {
        handler.apply(this, args);
      });
    },

    _validateEvent: function(eventName) {
      if(! (eventName in this._handlers)) {
        throw "Unknown event: " + eventName;
      }
    },

    _delegateEvent: function(eventName, target) {
      target.on(eventName, function(event) {
        this._emit(eventName, event);
      }.bind(this));
    },

    _addEvent: function(eventName) {
      this._handlers[eventName] = [];
    }
  };

  /**
   * Function: eventHandling
   *
   * Mixes event handling functionality into an object.
   *
   * The first parameter is always the object to be extended.
   * All remaining parameter are expected to be strings, interpreted as valid event
   * names.
   *
   * Example:
   *   (start code)
   *   var MyConstructor = function() {
   *     eventHandling(this, 'connected', 'disconnected');
   *
   *     this._emit('connected');
   *     this._emit('disconnected');
   *     // this would throw an exception:
   *     //this._emit('something-else');
   *   };
   *
   *   var myObject = new MyConstructor();
   *   myObject.on('connected', function() { console.log('connected'); });
   *   myObject.on('disconnected', function() { console.log('disconnected'); });
   *   // this would throw an exception as well:
   *   //myObject.on('something-else', function() {});
   *
   *   (end code)
   */
  return function(object) {
    var eventNames = Array.prototype.slice.call(arguments, 1);
    for(var key in methods) {
      object[key] = methods[key];
    }
    object._handlers = {};
    eventNames.forEach(function(eventName) {
      object._addEvent(eventName);
    });
  };
});

define('sockethub/client',[
  './extend',
  '../vendor/promising',
  './event_handling'
], function(extend, promising, eventHandling) {

  /**
   * Class: SockethubClient
   *
   * Provides a boilerplate client, that knows no verbs and no meaning in the
   * messages it processes, apart from the "rid" property.
   *
   * The client can then be extended with functionality, by using <declareVerb>,
   * or be used directly by sending objects using <sendObject>.
   *
   * Constructor parameters:
   *   jsonClient - a <JSONClient> instance
   */
  var SockethubClient = function(jsonClient, options) {
    this.jsonClient = jsonClient;
    this.options = options;

    this._ridPromises = {};

    eventHandling(this, 'connected', 'disconnected', 'failed');

    jsonClient.on('message', this._processIncoming.bind(this));
    this._delegateEvent('connected', jsonClient);
    this._delegateEvent('disconnected', jsonClient);
    this._delegateEvent('failed', jsonClient);
  };

  SockethubClient.prototype = {

    /**
     * Method: declareVerb
     *
     * Declares a new verb for this client.
     *
     * Declaring a verb will:
     *   - Add a method to the client, named like the verb.
     *   - Convert positional arguments of that method into message attributes.
     *   - Keep a template for messages sent using that verb.
     *
     * Parameters:
     *   verb           - (string) name of the verb, such as "post"
     *   attributeNames - (array) list of positional arguments for the verb method
     *   template       - (object) template to build messages upon
     *
     * Example:
     *   (start code)
     *
     *   // declare the "register" verb:
     *   client.declareVerb('register', ['object'], {
     *     platform: 'dispatcher'
     *   });
     *
     *   // send a "register" message, using the just declared method:
     *   client.register({ secret: '123' });
     *
     *   // will send the following JSON:
     *   {
     *     "verb": "register",
     *     "platform": "dispatcher",
     *     "object": {
     *       "secret": "123"
     *     },
     *     "rid": 1
     *   }
     *
     *   (end code)
     *
     * Receiving the response:
     *   The declared method returns a promise, which will notify you as soon as
     *   a response with the right "rid" is received.
     *
     * Example:
     *   (start code)
     *
     *   client.register({ secret: 123 }).
     *     then(function(response) {
     *       // response received
     *     }, function(error) {
     *       // something went wrong
     *     });
     *
     *   (end code)
     *
     * Nested attributes:
     *   If you want your verb methods to be able to modify deeply nested JSON
     *   structures through positional arguments, you can specify the path using
     *   dot notation.
     *
     * Example:
     *   (start code)
     *
     *   client.declareVerb('set', ['target.platform', 'object'], {
     *     platform: "dispatcher",
     *     target: {}
     *   });
     *
     *   client.set("smtp", {
     *     server: "example.com"
     *   });
     *
     *   // passing in "smtp" as "platform" here does not alter the toplevel
     *   // "platform" attribute, but instead adds one to "target":
     *   {
     *     "verb": "set",
     *     "platform": "dispatcher",
     *     "target": {
     *       "platform": "smtp"
     *     },
     *     "object": {
     *       "server": "example.com"
     *     }
     *   }
     *
     *   (end code)
     */
    declareVerb: function(verb, attributeNames, template, decorator) {
      this[verb] = function() {
        // 
        var args = Array.prototype.slice.call(arguments);
        var object = extend({}, template, { verb: verb });
        attributeNames.forEach(function(attrName, index) {
          var value = args[index];
          var current = this._getDeepAttr(object, attrName);
          if(typeof(current) === 'undefined' && typeof(value) === 'undefined') {
            throw new Error(
              "Expected a value for parameter " + attrName + ", but got undefined!"
            );
          }
          this._setDeepAttr(object, attrName, value);
        }.bind(this));
        var extensionArg = args[attributeNames.length];
        if(typeof(extensionArg) === 'object') {
          extend(object, extensionArg);
        }
        return this.sendObject(object);
      };
      if(decorator) {
        this[verb] = decorator(this[verb].bind(this));
      }
    },

    declareEvent: function(eventName) {
      this._addEvent(eventName);
    },

    disconnect: function() {
      this.jsonClient.disconnect();
    },

    // incremented upon each call to sendObject
    _ridCounter: 0,

    /**
     * Method: sendObject
     *
     * Sends the object through the JSONClient, attaching a "rid" attribute to
     * link it to a response.
     *
     * Returns a promise, which will be fulfilled as soon as a response carrying
     * the same "rid" attribute is received.
     *
     * You can either call this directly, building messages by hand or first
     * declare a verb using <declareVerb>, which will then call sendObject for you.
     *
     */
    sendObject: function(object) {
      var promise = promising();
      // generate a new rid and store promise reference:
      var rid = ++this._ridCounter;
      this._ridPromises[rid] = promise;
      object = extend(object, { rid: rid });
      console.log('SEND', object);
      // non-dectructively add 'rid' and send!
      this.jsonClient.send(object);
      return promise;
    },

    // _getDeepAttr / _setDeepAttr are used in declareType.

    _getDeepAttr: function(object, path, _parts) {
      var parts = _parts || path.split('.');
      var next = object[parts.shift()];
      return parts.length ? this._getDeepAttr(next, undefined, parts) : next;
    },

    _setDeepAttr: function(object, path, value, _parts) {
      var parts = _parts || path.split('.');
      if(parts.length > 1) {
        this._setDeepAttr(object[parts.shift()], undefined, value, parts);
      } else {
        object[parts[0]] = value;
      }
    },

    _processIncoming: function(object) {
      console.log(object.verb === 'confirm' ? 'CONFIRM' : 'RECEIVE', object);
      var rid = object.rid;
      if(typeof(rid) !== 'undefined') {
        var promise = this._ridPromises[rid];
        if(promise) {
          // rid is known.
          if(object.verb === 'confirm') {
            // exception: confirm results are ignored, unless their status is fals
            if(object.status) {
              return;
            } else {
              promise.reject(object);
            }
          } else {
            promise.fulfill(object);
          }
          delete this._ridPromises[rid];
        } else {
          // rid is not known. -> unexpected response!
          //this._emit('unexpected-response', object);
        }
      } else {
        // no rid set. -> this is not a response, but a message!
        //this._emit('message', object);
      }
    }

  };

  return SockethubClient;

});

define('sockethub/json_client',['./event_handling'], function(eventHandling) {

  /**
   * Class: JSONClient
   *
   * Exchanges JSON messages via a WebSocket
   *
   * Parameters:
   *   socket - a WebSocket object
   *
   */
  var JSONClient = function(socket) {
    this.socket = socket;

    eventHandling(
      this,

      /**
       * Event: message
       *
       * Emitted when a new JSON message is received.
       *
       * Parameters:
       *   object - the unpacked JSON object
       *
       */
      'message',

      /**
       * Event: connected
       *
       * Emitted when the websocket is opened.
       */
      'connected',

      /**
       * Event: disconnected
       *
       * Emitted when the websocket is closed.
       */
      'disconnected',

      /**
       * Event: disconnected
       *
       * Emitted when the websocket connection failed.
       */
      'failed'
    );

    // start listening.
    this._listen();
  };

  JSONClient.prototype = {

    /**
     * Method: send
     *
     * Serialize given object and send it.
     */
    send: function(object) {
      this.socket.send(JSON.stringify(object));
    },

    /**
     * Method: disconnect
     *
     * Close the socket.
     */
    disconnect: function() {
      this.socket.close();
    },

    // Start listening on socket
    _listen: function() {
      this.socket.onmessage = this._processMessageEvent.bind(this);
      this.connected = false;
      this.socket.onopen = function() {
        this.connected = true;
        this._emit('connected');
      }.bind(this);
      this.socket.onclose = function() {
        if(this.connected) {
          this._emit('disconnected');
          this.connected = false;
        } else {
          this._emit('failed');
        }
      }.bind(this);
    },

    // Emit "message" event 
    _processMessageEvent: function(event) {
      this._emit('message', JSON.parse(event.data));
    }

  };

  return JSONClient;

});

define('sockethub/connect',[
  './extend',
  './json_client',
  './client'
], function(extend, JSONClient, SockethubClient) {

  var DEFAULT_PORT = 10550;
  var DEFAULT_PATH = '/sockethub';
  var DEFAULT_PROTOCOL = 'sockethub';

  /**
   * Method: SockethubClient.connect
   *
   * Singleton method, used to construct a new client.
   *
   * Takes either a URI or an Object with connection options as it's only argument.
   * Returns a new <SockethubClient> instance, connected to a WebSocket through a
   * <JSONClient>.
   */
  var connect = function(uriOrOptions, options) {
    var uri;
    if(typeof(options) !== 'object') {
      options = {};
    }

    if(typeof(uriOrOptions) === 'string' &&
       ! uriOrOptions.match(/wss?\:\/\//)) {
      uriOrOptions = { host: uriOrOptions };
    }

    if(typeof(uriOrOptions) === 'string') {
      uri = uriOrOptions;
    } else if(typeof(uriOrOptions) === 'object') {
      extend(options, uriOrOptions);
      if(! options.host) {
        throw "Required 'host' option not present";
      }
      if(! options.port) {
        options.port = DEFAULT_PORT;
      }
      if(! options.path) {
        options.path = DEFAULT_PATH;
      }
      uri = (
        (options.ssl ? 'wss' : 'ws')
          + '://'
          + options.host
          + ':'
          + options.port
          + options.path
      );
    } else {
      throw "SockethubClient.connect expects a URI, specified via a String or Object.";
    }
    return new SockethubClient(new JSONClient(new WebSocket(uri, DEFAULT_PROTOCOL)), options);
  };

  return connect;

});

define('verbs/core',[], function() {

  var coreVerbs = function(client) {

    // Verb: ping
    //
    // Sends a "ping" command to the sockethub and calculates it's offset
    // upon a reply.
    //
    // Example:
    //   (start code)
    //
    //   var client = SockethubClient.connect({ host: 'localhost' });
    //
    //   client.on('connected', function() {
    //     client.register({ secret: '123' }).
    //       then(function() {
    //         return client.ping();
    //       }).
    //       then(function(response) {
    //         console.log('sockethub reply received after: ' + response.offset + 'ms');
    //       }, function(error) {
    //         console.log('sending ping failed: ' + error.message);
    //       });
    //   });
    //
    //   (end code)
    //
    client.declareVerb('ping', [], {
      platform: 'dispatcher'
    }, function(method) {
      return function(object) {
        if(typeof(object) !== 'object') {
          object = {};
        }
        if(typeof(object.timestamp) !== 'number') {
          object.timestamp = new Date().getTime();
        }
        return method(object).
          then(function(result) {
            result.offset = new Date().getTime() - object.timestamp;
            return result;
          });
      };
    });


    // Verb: register
    client.declareVerb('register', ['object'], {
      platform: 'dispatcher',
    }, function(method) {
      return function() {
        return method.apply(this, arguments).then(function(response) {
          if(! response.status) {
            client._emit('registration-failed', response);
            throw "Registration failed: " + response.message;
          }
          client._emit('registered');
          return response;
        });
      };
    });

    // Event: registered
    //
    // Fired when registration succeeded.
    client.declareEvent('registered');

    // Event: registration-failed
    //
    // Fired when registration failed.
    client.declareEvent('registration-failed');

    // Automatic registration, when 'register' option was passed during 'connect'.
    client.on('connected', function() {
      console.log('automatic registration!', client.options);
      if(client.options.register) {
        console.log('automatic registration!');
        client.register(client.options.register);
      }
    });


    // Verb: set
    client.declareVerb('set', ['target.platform', 'object'], {
      platform: 'dispatcher',
      target: {}
    });

  };

  return coreVerbs;
});

define('sockethub-client',[
  'sockethub/client',
  'sockethub/connect',
  'verbs/core'
], function(SockethubClient, connect, coreVerbs) {

  SockethubClient.connect = function() {
    var client = connect.apply(this, arguments);
    // extend the client with core verbs
    coreVerbs(client);
    return client;
  }

  return SockethubClient;

});


//   var websocket = new WebSocket(url);
//   var jsonClient = new JSONClient(websocket);
//   var client = new SockethubClient(jsonClient);

//   client.addVerb('register', ['object'], {
//     platform: 'dispatcher'
//   });

//   client.addVerb('set', ['target.platform', 'object'], {
//     platform: 'dispatcher',
//     target: {},
//     object: {}
//   });

//   client.addVerb('ping', [], {
//     platform: 'dispatcher'
//   });

//   var pub = {};
//   //var noDelay = false; // delay the register command by 2 secs (read register function)
//   var cfg = {
//     enablePings:  false,
//     confirmationTimeout: 6000
//   };
//   var client;
//   var isRegistered = false;
//   var isConnected = false;
//   var ridDB = {
//     counter: 0
//   };
//   // maps 'rid's to a function that is being called once a response with that rid
//   // is received. After that the function will be cleaned up
//   var ridHandlers = {};
//   var ping = {
//     sent: 0,
//     received: 0,
//     paused: false
//   };
//   var callbacks = {
//     //connect: function () {},
//     message: function () {},
//     response: function () {},
//     error: function () {},
//     close: function () {},
//     //register: function () {},
//     ping: function () {}
//   };

//   function assertConnected() {
//     if(typeof(sock) === 'undefined') {
//       throw new Error("You need to connect sockethub before sending anything!");
//     }
//   }

//   var sendData = {
//     ping: {
//       verb: 'ping',
//       platform: 'dispatcher'
//     },
//     register: {
//       verb: 'register',
//       platform: 'dispatcher',
//       object: {
//         //remoteStorage: {
//         //  storageInfo: '',
//         //  bearerToken: '',
//         //  scope: ''
//         //},
//         secret: ''
//       }
//     },
//     send: {
//       verb: "send",
//       target : {
//         to: [  // at least one record for 'to' required
//           {
//             address: ""
//           }
//         ],
//         cc: [],  // ignored if undefined or empty
//         bcc: []  // ignored if undefined or empty
//       },
//       object: {
//         headers: {},  // name/value pairs of header data to use
//         subject: "Hello ...",  // URL encoded string
//         text: "Is it me you're looking for?"  // URL encoded string
//       },
//       actor: {
//         address: ""
//       }
//     },
//     post: {
//       verb: "post",
//       target: {
//         to: [  // at least one record for 'to' required
//           {
//             address: ""
//           }
//         ],
//         cc: []  // ignored if undefined or empty
//       },
//       object: {
//         text: "Is it me you're looking for?"  // URL encoded string
//       },
//       actor: {
//         address: ""
//       }
//     },
//     set: {
//       verb: "set",
//       platform: "dispatcher",
//       target: {
//         platform: ""
//       },
//       object: {}
//     }
//   };

//   pub.on = function (type, callback) {
//     if ((typeof callbacks[type] !== 'undefined') &&
//         (typeof callback === 'function')) {
//       callbacks[type] = callback;
//     } else if (type === 'ping') {
//       ping.callback = callback;
//     } else {
//       console.log('invalid callback function or type name: ' + type);
//     }
//   };

//   pub.connect = function (o) {
//     var promise = promising();
//     var isConnecting = true;
//     if (typeof o !== 'object') {
//       promise.reject('connection object not received');
//       return promise;
//     }

//     if (typeof o.host !== 'undefined') {
//       cfg.host = o.host;
//     }
//     if (typeof o.confirmationTimeout !== 'undefined') {
//       cfg.confirmationTimeout = o.confirmationTimeout;
//     }
//     if (typeof o.enablePings !== 'undefined') {
//       cfg.enablePings = o.enablePings;
//     }

//     if (typeof cfg.host === 'undefined') {
//       log(3, null, "sockethub.connect requires an object parameter with a 'host' property", o);
//       promise.reject("sockethub.connect requires an object parameter with a 'host' property");
//     } else {
//       log(1, null, 'attempting to connect to ' + cfg.host);

//       var sock;

//       try {
//         sock = new WebSocket(cfg.host, 'sockethub');
//       } catch (e) {
//         log(3, null, 'error connecting to sockethub: ' + e);
//         promise.reject('error connecting to sockethub: ' + e);
//       }

//       client = new JSONClient(sock);

//       if (sock) {
//         sock.onopen = function () {
//           ping.pause = false;
//           isConnected = true;
//           if (isConnecting) {
//             isConnecting = false;
//             promise.fulfill();
//           }
//         };

//         sock.onclose = function () {
//           ping.pause = true;
//           isConnected = false;
//           if (isConnecting) {
//             isConnecting = false;
//             promise.reject("unable to connect to sockethub at "+cfg.host);
//           }
//           callbacks.close();
//         };

//         client.on('message', function (data) {
//           var now = new Date().getTime();

//           if (data.verb === "ping") {
//             //} else if ((typeof data.response === 'object') &&
//             //           (typeof data.response.timestamp === 'number')) {
//             // incoming ping
//             var sentTime = parseInt(data.response.timestamp, null);
//             if (ping.sent > sentTime) {
//               log(3, data.rid, 'out of date ping response received');
//               return false;
//             } else {
//               ping.received = now;
//             }

//             ping.rid = data.rid;
//             log(1, data.rid, 'response received: '+data);
//             if (data.rid) {
//               processCallback(ping);
//             } else {
//               var msg = 'no rid found on ping';
//               if (data.message) {
//                 msg = data.message;
//               }
//               callbacks.error(data, msg);
//             }

//           } else if (data.verb === 'confirm') {
//             //log(1, data.rid, 'confirmation receipt received. ' + e.data);
//             ridDB[data.rid]['received'] = now;
//             // XXX - how to expose confirms to the front-end?
//             // call the error portion of the callback when the confirmation hasn't
//             // been received for [confirmationTimeout] miliseconds.

//           } else {
//             if (typeof data.rid === 'undefined') {
//               log(3, data.rid, e.data);
//               callbacks.message(data);
//             } else {
//               var handler = ridHandlers[data.rid];
//               if(handler) {
//                 delete ridHandlers[data.rid];
//                 handler(data);
//               } else {
//                 log(2, data.rid, e.data);
//                 callbacks.response(data);
//               }
//             }
//           }
//         };
//       }
//     }
//     return promise;
//   };

//   pub.reconnect = function () {
//     ping.pause = true;
//     setTimeout(function () {
//       sock.close();
//       pub.connect();
//     }, 0);
//   };

//   pub.isConnected = function () {
//     return isConnected;
//   };

//   /*window.addEventListener('load', function() {
//     setInterval(function () {
//       if (doPings) {
//         var now = new Date().getTime();
//         if(sock.readyState === WebSocket.CONNECTING) {
//         } else if(sock.readyState === WebSocket.OPEN) {
//           if (isRegistered) {
//             var sendMsg = sendData.ping;
//             sendMsg.rid = getRID('ping');
//             sendMsg.timestamp = now;
//             var json_sendMsg = JSON.stringify(sendMsg);
//             //log(1, sendMsg.rid, json_sendMsg);
//             sock.send(json_sendMsg);
//           }
//         } else if(sock.readyState === WebSocket.CLOSING) {
//         } else {  // CLOSED or non-existent
//           //console.log('sock.readyState: '+sock.readyState);
//           pub.connect();
//         }
//       }
//     }, 1000);
//   });*/


//   //
//   // processCallback(o)
//   function processCallback(o) {
//     if ((typeof ridDB[o.rid] !== 'undefined') &&
//         (typeof ridDB[o.rid].promise === 'object')) {
//       if ((typeof o.status !== 'undefined') &&
//           (o.status === true)) {
//         // success, call promise for this request
//         ridDB[o.rid].promise.fulfill(o);
//       } else {
//         // call error promise
//         ridDB[o.rid].promise.reject(o.message, o);
//       }
//     } else {
//       if ((typeof o.rid !== 'undefined') && (o.rid > 0)) {
//         // rid found, this is a response
//         callbacks.response(o);
//       } else {
//         // no rid found, this is a new incoming message
//         callbacks.message(o);
//       }

//       //if (typeof callbacks[o.verb] === 'function') {
//       //  callbacks[o.verb](o);
//       //} else {
//       //  log(3, o.rid, 'failed to find promise or callback');
//       //}
//     }
//   }

//   /**
//    * Function: togglePings
//    *
//    * toggles pausing of pings, returns value of pause status
//    *
//    * Returns:
//    *
//    *   return
//    *     true  - pings are paused
//    *     false - pings are active
//    */
//   pub.togglePings = function () {
//     ping.pause = (ping.pause) ? false : true;
//     return ping.pause;
//   };

//   function log(type, rid, message) {
//     // TODO FIXME
//     // logs not working for now, lets get back to this later
//     return;
//     var c = { 1:'blue', 2:'green', 3:'red'};
//     var d = new Date();
//     var ds = (d.getHours() + 1) + ':' + d.getMinutes() + ':' + d.getSeconds();
//     var verb;
//     var prefix;
//     if (rid) {
//       verb = lookupVerb(rid);
//       prefix = ds + ' ['+verb+']';
//     } else {
//       prefix = ds + ' []';
//     }
//     var p = document.createElement('p');
//     p.style.color = c[type];
//     var pmsg = document.createTextNode(prefix + ' - ' + message +"\n");
//     p.appendChild(pmsg);
//     var pre = document.getElementById('log_output');
//     pre.insertBefore(p, pre.childNodes[0]);

//     if (type === 1) {
//       console.log(' [sockethub] info - '+message);
//     } else if (type === 2) {
//       console.log(' [sockethub] success - '+message);
//     } else if (type === 3) {
//       console.log(' [sockethub] error - '+message);
//     }
//   }

//   function getRID(verb) {
//     ridDB.counter++;
//     rid = ridDB.counter;
//     ridDB[rid] = {
//       verb: verb,
//       sent: new Date().getTime()
//     };
//     delete ridDB[rid - 20];
//     return rid;
//   }

//   function lookupVerb(rid) {
//     var v = '';
//     if (typeof ridDB[rid] !== 'undefined') {
//       v =  ridDB[rid].verb;
//     }
//     return v;
//   }

//   /**
//    * Function: register
//    *
//    * register client with sockethub server
//    *
//    * Parameters:
//    *
//    *   o - object
//    *       The value of the object area of the JSON.
//    *
//    * Returns:
//    *
//    *   return n/a
//    */
//   pub.register = function (o) {
//     assertConnected();
//     var r = sendData.register;

//     r.object = o;
//     return this.sendObject(r, getRID('register')).
//       then(function(result) {
//         if(! result.status) {
//           throw "Failed to register with sockethub. Reason: " + result.message;
//         }
//       });
//   };

//   /**
//    * Function: sendObject
//    *
//    * Send given object, setting it's 'rid' as specified.
//    *
//    * Returns a promise, which will be fulfilled with the first response carrying
//    * the same 'rid'.
//    */
//   pub.sendObject = function(object, rid) {
//     var promise = promising();
//     object.rid = rid;
//     ridHandlers[rid] = promise.fulfill;
//     client.send(object);
//     return promise;
//   };

//   pub.set = function (platform, data) {
//     assertConnected();
//     var r = sendData.set;
//     r.target.platform = platform;
//     r.object = data;
//     r.rid = getRID('set');
//     client.send(r);
//   };

//   pub.send = function (platform, actor, target, object) {
//     assertConnected();
//     var r = sendData.send;
//     r.platform = platform;
//     r.object = object;
//     r.actor = actor;
//     r.target = target;
//     r.rid = getRID('send');
//     client.send(r);
//   };

//   pub.post = function (platform, actor, target, object) {
//     assertConnected();
//     var r = sendData.post;
//     r.platform = platform;
//     r.object = object;
//     r.actor = actor;
//     r.target = target;
//     r.rid = getRID('post');
//     var rawMessage = JSON.stringify(r);
//     log(1, r.rid, rawMessage);
//     sock.send(rawMessage);
//   };

//   pub.submit = function (o) {
//     assertConnected();
//     o.rid = getRID(o.verb);
//     var json_o = JSON.stringify(o);
//     log(1, o.rid, 'submitting: '+json_o);
//     sock.send(json_o);
//   };

//   //window.addEventListener('load', pub.connect);
//   return pub;
// }(window, document));

