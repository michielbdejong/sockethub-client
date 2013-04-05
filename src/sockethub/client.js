define(['../vendor/promising'], function(promising) {

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

  /**
   * Class: SockethubClient
   *
   * 
   */
  var SockethubClient = function(jsonClient) {
    this.jsonClient = jsonClient;

    this._ridPromises = {};
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
    declareVerb: function(verb, attributeNames, template) {
      this[verb] = function() {
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
        });
        return this.sendObject(object);
      };
    },

    // Property: ridCounter
    //
    _ridCounter: 0,

    // Attaches RID to given object and sends it.
    // Returns a promise.
    sendObject: function(object) {
      var promise = promising();
      var rid = ++this._ridCounter;
      this._ridPromises[rid] = promise;

      this.jsonClient.send(extend(object, { rid: rid }));
      return promise;
    },

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
    }

  };

  return SockethubClient;

});
