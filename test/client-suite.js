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
          _eventHandlers = { message: [] },
          _sentObjects: []
        };
        env.client = new env.SockethubClient(env.fakeJsonClient);
        test.done();
      },

      tests: [
        
      ]
    }
  ];

});