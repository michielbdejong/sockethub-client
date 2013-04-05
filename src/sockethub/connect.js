define([
  './extend',
  './json_client',
  './client'
], function(extend, JSONClient, SockethubClient) {

  var DEFAULT_PORT = 10550;
  var DEFAULT_PATH = '/sockethub';
  var DEFAULT_PROTOCOL = 'sockethub';

  /**
   * Method: SockethubClient.connect
   *
   * Singleton method, used to construct a new client.
   *
   * Takes either a URI or an Object with connection options as it's only argument.
   * Returns a new <SockethubClient> instance, connected to a WebSocket through a
   * <JSONClient>.
   */
  var connect = function(uriOrOptions, options) {
    var uri;
    if(typeof(options) !== 'object') {
      options = {};
    }

    if(typeof(uriOrOptions) === 'string' &&
       ! uriOrOptions.match(/wss?\:\/\//)) {
      uriOrOptions = { host: uriOrOptions };
    }

    if(typeof(uriOrOptions) === 'string') {
      uri = uriOrOptions;
    } else if(typeof(uriOrOptions) === 'object') {
      extend(options, uriOrOptions);
      if(! options.host) {
        throw "Required 'host' option not present";
      }
      if(! options.port) {
        options.port = DEFAULT_PORT;
      }
      if(! options.path) {
        options.path = DEFAULT_PATH;
      }
      uri = (
        (options.ssl ? 'wss' : 'ws')
          + '://'
          + options.host
          + ':'
          + options.port
          + options.path
      );
    } else {
      throw "SockethubClient.connect expects a URI, specified via a String or Object.";
    }
    return new SockethubClient(new JSONClient(new WebSocket(uri, DEFAULT_PROTOCOL)), options);
  };

  return connect;

});
