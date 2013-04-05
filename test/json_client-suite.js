if(typeof(define) !== 'function') {
  var define = require('amdefine')(module);
}
define(['requirejs'], function(requirejs) {

  return [
    {

      name: "JSONClient",
      desc: "sends and receives JSON data via a WebSocket",

      setup: function(env, test) {
        requirejs([
          './src/sockethub/json_client'
        ], function(JSONClient) {
          env.JSONClient = JSONClient;
          test.done();
        });
      },

      beforeEach: function(env, test) {
        env.sentMessages = [];
        env.socketClosed = false;
        env.socket = {
          send: function(data) {
            env.sentMessages.push(data);
          },
          close: function() {
            env.socketClosed = true;
          }
        };
        env.client = new env.JSONClient(env.socket);
        test.done();
      },

      tests: [

        {
          desc: "it listens on the websocket",
          run: function(env, test) {
            test.assertType(env.socket.onmessage, 'function');
          }
        },

        {
          desc: "it provides message events",
          run: function(env, test) {
            env.client.on('message', function() {});
            test.done();
          }
        },

        {
          desc: "it unpacks messages and forwards them and fires 'message' events",
          run: function(env, test) {
            env.client.on('message', function(object) {
              test.assert(object, { socket: 'hub' });
            });
            // emulate message event
            env.socket.onmessage({ data: '{"socket":"hub"}' });
          }
        },

        {
          desc: "it packs messages and sends them over the socket",
          run: function(env, test) {
            env.client.send({ socket: 'hub' });
            test.assert(env.sentMessages, [ '{"socket":"hub"}' ]);
          }
        },

        {
          desc: "it emits 'connected', once the websocket is connected",
          timeout: 500,
          run: function(env, test) {
            env.client.on('connected', function() {
              test.done();
            });
            test.assertTypeAnd(env.socket.onopen, 'function', 'expected onopen handler on the socket');
            env.socket.onopen();
          }
        },

        {
          desc: "it emits 'disconnected', once the websocket is closed after being opened",
          timeout: 500,
          run: function(env, test) {
            env.client.on('disconnected', function() {
              test.done();
            });
            test.assertTypeAnd(env.socket.onclose, 'function', 'expected onclose handler on the socket');
            env.socket.onopen();
            env.socket.onclose();
          }
        },

        {
          desc: "it emits 'failed', if the websocket is closed without ever being opened",
          timeout: 500,
          run: function(env, test) {
            env.client.on('failed', function() {
              test.done();
            });
            test.assertTypeAnd(env.socket.onclose, 'function', 'expected onclose handler on the socket');
            env.socket.onclose();
          }
        },

        {
          desc: "#disconnect closes the socket connection",
          run: function(env, test) {
            env.client.disconnect();
            test.assert(env.socketClosed, true);
          }
        }

      ]


    }
  ];

});