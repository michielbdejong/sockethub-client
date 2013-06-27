define([], function() {

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
        if(client.registered) {
          console.log('WARNING: already registered!');
          console.trace();
        }
        return method.apply(this, arguments).then(function(response) {
          client.registered = response.status;
          if(! response.status) {
            setTimeout(function() {
              client._emit('registration-failed', response);
            }, 0);
            throw "Registration failed: " + response.message;
          }
          setTimeout(function() { client._emit('registered'); }, 0);
          return response;
        });
      };
    });

    client.registered = false;

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

    client.on('disconnected', function() {
      // make sure 'registered' flag is not set, in case the client is re-used.
      delete client.registered;
    });

    // Verb: set
    client.declareVerb('set', ['target.platform', 'object'], {
      platform: 'dispatcher',
      target: {}
    });

  };

  return coreVerbs;
});
