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
        },

        {
          desc: "#declareVerb declares a new verb method",
          run: function(env, test) {
            env.client.declareVerb('travel', [], {});
            test.assertType(env.client.travel, 'function');
          }
        },

        {
          desc: "verb methods send an object with the right verb",
          run: function(env, test) {
            env.client.declareVerb('travel', [], {});

            env.client.travel();

            test.assertAnd(env.fakeJsonClient._sentObjects.length, 1);
            test.assertAnd(env.fakeJsonClient._sentObjects[0].verb, 'travel');
            test.done();
          }
        },

        {
          desc: "verb methods attach positional arguments as attributes to the method",
          run: function(env, test) {
            env.client.declareVerb('travel', ['origin', 'destination'], {});

            env.client.travel('Hamburg', 'Berlin');

            var sentObject = env.fakeJsonClient._sentObjects.shift();
            test.assertAnd(sentObject.origin, 'Hamburg');
            test.assertAnd(sentObject.destination, 'Berlin');
            test.done();
          }
        },

        {
          desc: "verb methods apply the provided template to the sent message",
          run: function(env, test) {
            env.client.declareVerb('travel', [], {
              origin: {},
              destination: {}
            });

            env.client.travel();

            var sentObject = env.fakeJsonClient._sentObjects.shift();
            test.assertAnd(sentObject.origin, {});
            test.assertAnd(sentObject.destination, {});
            test.done();
          }
        },

        {
          desc: "verb methods' positional parameter can modify nested structures from the tempalte",
          run: function(env, test) {
            env.client.declareVerb('travel', ['origin.city', 'destination.city'], {
              origin: {},
              destination: {}
            });

            env.client.travel('Hamburg', 'Berlin');

            var sentObject = env.fakeJsonClient._sentObjects.shift();
            test.assertAnd(sentObject.origin.city, 'Hamburg');
            test.assertAnd(sentObject.destination.city, 'Berlin');
            test.done();
          }
        }
      ]
    }
  ];
  
});
