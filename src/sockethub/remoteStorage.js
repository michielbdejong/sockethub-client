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

define([], function() {

  var module = function(privateClient, publicClient) {
    privateClient.declareType('config', {
      "description" : "sockethub config file",
      "type" : "object",
      "properties": {
        "host": {
          "type": "string",
          "description": "the hostname to connect to",
          "format": "uri",
          "required": true
        },
        "port": {
          "type": "number",
          "description": "the port number to connect to",
          "required": true
        },
        "secret": {
          "type": "string",
          "description": "the secret to identify yourself with the sockethub server",
          "required": true
        }
      }
    });

    return {
      exports: {
        getConfig: function() {
          return privateClient.getObject('config.json');
        },
        writeConfig: function(data) {
          //console.log(' [RS] writeConfig()');
          return privateClient.storeObject('config', 'config.json', data);
        }
      }
    };
  };

  function connectRemoteStorage(remoteStorage) {
    remoteStorage.defineModule('sockethub', module);
    remoteStorage.access.claim('sockethub', 'rw');

    var token = remoteStorage.getBearerToken();
    if(typeof(token) === "string" && token.length > 0) {
      if(! this.options.register) {
        this.options.register = {};
      }
      // FIXME: this basically copies remoteStorage.access._scopeModeMap, which is
      //   private. Instead remoteStorage.js should give public access to the scope
      //   mode map.
      var scope = {};
      remoteStorage.access.scopes.forEach(function(key) {
        scope[key] = remoteStorage.access.get(key);
      });

      var storageInfo = remoteStorage.getStorageInfo();
      storageInfo.type = String(storageInfo.type); // wtf?

      this.options.register.remoteStorage = {
        storageInfo: storageInfo,
        bearerToken: token,
        scope: scope
      }
    }
  }

  return connectRemoteStorage;

});