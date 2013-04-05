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
