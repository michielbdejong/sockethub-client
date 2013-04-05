define(['../vendor/promising'], function(promising) {

  /**
   * Class: SockethubClient
   *
   * 
   */
  var SockethubClient = function(jsonClient) {
    this.jsonClient = jsonClient;

    this._ridPromises = {};
  };

  Client.prototype = {

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
     */
    declareVerb: function(verb, attributeNames, template) {
      this[verb] = function() {
        var args = Array.prototype.slice.call(arguments);
        var object = extend({}, template, { verb: verb });
        attributeNames.forEach(function(attrName, index) {
          var value = args[index];
          var current = object[attrName];
          if(typeof(current) === 'undefined' && typeof(value) === 'undefined') {
            throw new Error(
              "Expected a value for parameter " + attrName + ", but got undefined!"
            );
          }
          object[attrName] = value;
        });
        return this._send(object);
      }
    },

    // Property: ridCounter
    //
    _ridCounter: 0,

    // Attaches RID to given object and sends it.
    // Returns a promise.
    _send: function(object) {
      var promise = promising();
      var rid = ++this._ridCounter;
      this._ridPromises[rid] = promise;

      this.jsonClient.send(extend(object, { rid: rid }));
      return promise;
    }

  };

  return SockethubClient;

});
