/**
 * This file is part of sockethub-client.
 *
 * © 2013 Niklas E. Cathor (https://github.com/nilclass)
 * © 2013 Nick Jennings (https://github.com/silverbucket)
 *
 * sockethub-client is dual-licensed under either the MIT License or GPLv3 (at your choice).
 * See the files LICENSE-MIT and LICENSE-GPL for details.
 *
 * The latest version of sockethub-client can be found here:
 *   git://github.com/sockethub/sockethub-client.git
 *
 * For more information about sockethub visit http://sockethub.org/.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 */

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
