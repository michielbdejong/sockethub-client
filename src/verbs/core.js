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
        console.log('decorated ping: ', object);
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
            throw "Registration failed: " + response.message;
          }
          return response;
        });
      };
    });


    // Verb: set
    client.declareVerb('set', ['target.platform', 'object'], {
      platform: 'dispatcher',
      target: {}
    });

  };

  return coreVerbs;
});
