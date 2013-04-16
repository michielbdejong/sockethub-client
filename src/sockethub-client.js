define([
  'sockethub/client',
  'sockethub/connect',
  'sockethub/remoteStorage',
  'verbs/core'
], function(SockethubClient, connect, connectRemoteStorage, coreVerbs) {

  SockethubClient.connect = function() {
    var client = connect.apply(this, arguments);
    // extend the client with core verbs
    coreVerbs(client);
    return client;
  }

  SockethubClient.prototype.connectStorage = connectRemoteStorage;

  return SockethubClient;

});

