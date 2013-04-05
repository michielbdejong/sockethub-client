if(typeof(define) !== 'function') {
  var define = require('amdefine')(module);
}
define(['requirejs'], function(requirejs) {

  return [
    {
      name: "SockethubClient",
      desc: "Provides a boilerplate for writing sockethub clients",
      setup: function(env, test) {
        requirejs([
          './src/sockethub/client'
        ], function(SockethubClient) {
          env.SockethubClient = SockethubClient;
          test.done();
        });
      },

      beforeEach: function(env, test) {
        env.fakeJsonClient = {
          send: function(object) {
            this._sentObjects.push(object);
          },
          on: function(eventName, handler) {
            this._eventHandlers[eventName] = handler;
          },
          _eventHandlers: { message: [] },
          _sentObjects: []
        };
        env.client = new env.SockethubClient(env.fakeJsonClient);
        test.done();
      },

      tests: [
        {
          desc: "#sendObject attaches a 'rid'",
          run: function(env, test) {
            env.client.sendObject({
              send: "the f***ing message"
            });
            test.assert(env.fakeJsonClient._sentObjects, [
              {
                send: "the f***ing message",
                rid: 1
              }
            ]);
          }
        },

        {
          desc: "#sendObject returns a promise",
          run: function(env, test) {
            var result = env.client.sendObject({});
            test.assertTypeAnd(result, 'object');
            test.assertType(result.then, 'function');
          }
        },

        {
          desc: "#sendObject increments the 'rid' with each call",
          run: function(env, test) {
            env.client.sendObject({});
            env.client.sendObject({});
            env.client.sendObject({});
            var sent = env.fakeJsonClient._sentObjects;
            test.assertAnd(sent[0].rid, 1);
            test.assertAnd(sent[1].rid, 2);
            test.assertAnd(sent[2].rid, 3);
            test.done();
          }
        }
      ]
    }
  ];
  
});