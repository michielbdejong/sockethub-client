define(['./event_handling'], function(eventHandling) {

  /**
   * Class: JSONClient
   *
   * Exchanges JSON messages via a WebSocket
   *
   * Parameters:
   *   socket - a WebSocket object
   *
   */
  var JSONClient = function(socket) {
    this.socket = socket;

    eventHandling(
      this,

      /**
       * Event: message
       *
       * Emitted when a new JSON message is received.
       *
       * Parameters:
       *   object - the unpacked JSON object
       *
       */
      'message'
    );

    // start listening.
    this._listen();
  };

  JSONClient.prototype = {

    /**
     * Method: send
     *
     * Serialize given object and send it.
     */
    send: function(object) {
      this.socket.send(JSON.stringify(object));
    },

    // Start listening on socket
    _listen: function() {
      this.socket.onmessage = this._processMessageEvent.bind(this);
    },

    // Emit "message" event 
    _processMessageEvent: function(event) {
      this._emit('message', JSON.parse(event.data));
    }

  };

  return JSONClient;

});
