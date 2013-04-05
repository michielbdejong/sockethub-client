if(typeof(define) !== 'function') {
  var define = require('amdefine')(module);
}
define(['requirejs'], function(requirejs) {

  return [

    {
      name: "SockethubClient.connect",
      desc: "provides the public interface for connecting",
      setup: function(env, test) {
        requirejs([
          './src/sockethub/connect'
        ], function(connect) {
          env.connect = connect;

          global.WebSocket = function(uri, protocol) {
            env.websocketURI = uri;
            env.websocketProtocol = protocol;
            env.websocketInstances.push(this);
          };

          test.done();
        });
      },

      beforeEach: function(env, test) {
        env.websocketURI = undefined;
        env.websocketProtocol = undefined;
        env.websocketInstances = [];
        test.done();
      },

      tests: [
        
        {
          desc: "it throws an error, when it doesn't receive a URI",
          run: function(env, test) {
            try {
              env.connect();
              test.result(false);
            } catch(exc) {
              test.done();
            };
          }
        },

        {
          desc: "it throws an error, if it doesn't receive a 'host' option",
          run: function(env, test) {
            try {
              env.connect({});
              test.result(false);
            } catch(exc) {
              test.done();
            };
          }
        },

        {
          desc: "it opens a WebSocket connection with the given URI string",
          run: function(env, test) {
            env.connect('ws://localhost:81');
            test.assertAnd(env.websocketInstances.length, 1);
            test.assertAnd(env.websocketURI, 'ws://localhost:81');
            test.assertAnd(env.websocketProtocol, 'sockethub');
            test.done();
          }
        },

        {
          desc: "it builds the URI correctly using defaults, if it receives a URI object",
          run: function(env, test) {
            env.connect({ host: 'localhost' });
            test.assert(env.websocketURI, 'ws://localhost:10550/sockethub');
          }
        },

        {
          desc: "it uses the 'wss' protocol, if 'ssl' option is set",
          run: function(env, test) {
            env.connect({ host: 'localhost', ssl: true });
            test.assert(env.websocketURI, 'wss://localhost:10550/sockethub')
          }
        },

        {
          desc: "it allows 'path' and 'port' to be set via options",
          run: function(env, test) {
            env.connect({
              host: 'localhost',
              port: 12345,
              path: '/suckitup'
            });
            test.assert(env.websocketURI, 'ws://localhost:12345/suckitup');
          }
        },

        {
          desc: "it returns a SockethubClient",
          run: function(env, test) {
            var result = env.connect('ws://localhost:81/');
            test.assertTypeAnd(result, 'object');
            test.assertTypeAnd(result.sendObject, 'function');
            test.done();
          }
        },

        {
          desc: "it instantiates a JSONClient to connect WebSocket and SockethubClient",
          run: function(env, test) {
            var client = env.connect({ host: 'localhost' });
            test.assertTypeAnd(client.jsonClient, 'object');
            test.assertTypeAnd(client.jsonClient.send, 'function');
            test.assertTypeAnd(client.jsonClient.on, 'function');
            test.assert(client.jsonClient.socket, env.websocketInstances[0]);
          }
        },

        {
          desc: "It passes the options, or an empty options object to the SockethubClient",
          run: function(env, test) {
            var client = env.connect({ host: 'localhost', something: 'else' });
            test.assert(client.options.something, 'else');
          }
        },

        {
          desc: "It interprets URIs without a protocol as a 'host' option",
          run: function(env, test) {
            var client = env.connect('localhost');
            test.assert(env.websocketURI, 'ws://localhost:10550/sockethub');
          }
        },

        {
          desc: "It takes options as it's second argument, when a URI string is given",
          run: function(env, test) {
            var client = env.connect('localhost', { port: 81 });
            test.assert(env.websocketURI, 'ws://localhost:81/sockethub');
          }
        }

      ]
    }

  ];
});
