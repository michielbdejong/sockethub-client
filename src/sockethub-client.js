define([
  'sockethub/client',
  'sockethub/connect',
  'verbs/core'
], function(SockethubClient, connect, coreVerbs) {

  SockethubClient.connect = function() {
    var client = connect.apply(this, arguments);
    // extend the client with core verbs
    coreVerbs(client);
    return client;
  }

  return SockethubClient;

});

