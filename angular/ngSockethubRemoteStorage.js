angular.module('ngSockethubRemoteStorage', ['ngSockethubClient', 'ngRemoteStorage']).


/**
 * run
 */
run(['$rootScope', '$q', '$timeout', 'settings', 'SH', 'RS',
function ($rootScope, $q, $timeout, settings, SH, RS) {

  SH.on('connect', function () {
    // sockethub connected, save settings to RS
    console.log('Sockethub-RemoteStorage: saving sockethub config to remoteStorage');
    RS.call('sockethub', 'writeConfig', [settings.conn]).then(function () {
      console.log('config saved to RS');
    }, function (err) {
      console.log('Sockethub-RemoteStorage: Failed saving sockethub config to remoteStorage: '+err);
    });
  });

}]);