define([
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
