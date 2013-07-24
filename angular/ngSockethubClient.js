angular.module('ngSockethubClient', []).


/**
 * default settings
 */
value('SockethubSettings', {
  conn: {
    host: 'localhost',
    port: '10550',
    path: '/sockethub',
    tls: false,
    secret: '1234567890'
  },
  env: {
    logo: '/res/img/sockethub-logo.svg'
  },
  save: function (prop, obj) {
    if (this.verify(prop, obj)) {
      this[prop] = obj;
      return true;
    } else {
      return false;
    }
  },
  exists: function (prop) {
    this.verify(prop, config);
  },
  verify: function (prop, p) {
    if (!p) {
      p = this[prop];
    }
    if ((p.host) && (p.host !== '') &&
        (p.port) && (p.port !== '') &&
        (p.path) && (p.path !== '') &&
        (typeof p.tls === 'boolean') &&
        (p.secret) && (p.secret !== '')) {
      return true;
    } else {
      return false;
    }
  }
}).


/**
 * factory: SH
 */
factory('SH', ['$rootScope', '$q', '$timeout', 'SockethubSettings',
function ($rootScope, $q, $timeout, settings) {
  var sc;
  var config = settings.conn;
  var callbacks = {
    'error': {},
    'message': {},
    'response': {},
    'close': {}
  };

  function isConnected() {
    if (sc) {
      return sc.connected;
    } else {
      return false;
    }
  }

  function isRegistered() {
    if (sc) {
      return sc.registered;
    } else {
      return false;
    }
  }

  function callOnReady(p) {
    var defer = $q.defer();
    var delay = 500;
    (function __call() {
      if (p.testFunc()) {
        console.log('SH: calling: '+p.callFunc);
        sc[p.callFunc].apply(sc, p.callParams)
          .then(function (e) {
            $rootScope.$apply(defer.resolve(e));
          }, function (e) {
            $rootScope.$apply(defer.reject(e));
          });
      } else {
        console.log('SH: delaying call ' + delay + 's');
        if (delay < 30000) {
          delay = delay + (delay * 2);
        }
        $timeout(__call, delay);
      }
    })();
    return defer.promise;
  }

  function connect(p) {
    var defer = $q.defer();
    var scheme = 'ws://';
    if (settings.conn.tls) {
      scheme = 'wss://';
    }

    var robj = {};
    if (p.register) {
      robj = {
        register: {
          secret: settings.conn.secret
        }
      };
    }

    sc = SockethubClient.connect(scheme +
                                 settings.conn.host + ':' +
                                 settings.conn.port +
                                 settings.conn.path,
                                 robj
    );

    sc.on('registered', function () { // connected
      console.log('Sockethub connected & registered');
      $rootScope.$apply(function () {
        defer.resolve();
      });
    });

    sc.on('registration-failed', function (err) { // connected
      console.log('Sockethub register failed ', err);
      $rootScope.$apply(function () {
        defer.reject(err);
      });
    });

    sc.on('failed', function (err) { // connection failed
      console.log('Sockethub connection failed ', err);
      $rootScope.$apply(function () {
        defer.reject('Failed connecting to sockethub at ' + scheme +
                     settings.conn.host + ':' + settings.conn.port +
                     settings.conn.path);
      });
    });

    sc.on('disconnected', function (err) { // disconnected
      console.log('SH received disconnect(close) '+err);
    });

    sc.on('message', function (data) { // message
      if ((data.platform) &&
          (callbacks['message'][data.platform])) {
        console.log('SH passing message to platform: '+data.platform);
        $rootScope.$apply(callbacks['message'][data.platform](data));
      } else {
        console.log('SH received message with nothing to call: ', data);
      }
    });

    sc.on('unexpected-response', function (msg) {
      console.log('SH unexpected response: ', msg);
    });

    return defer.promise;
  }

  function register() {
    var defer = $q.defer();
    console.log('SH.register() called');
    callOnReady({
      testFunc: isConnected,
      callFunc: 'register',
      callParams: [{
        secret: settings.conn.secret
      }]
    }).then(defer.resolve, defer.reject);
    return defer.promise;
  }

  function sendSet(platform, type, index, object) {
    var defer = $q.defer();
    var data = {};
    data[type] = {};
    data[type][index] = object;

    callOnReady({
      testFunc: isRegistered,
      callFunc: 'set',
      callParams: [platform, data]
    }).then(defer.resolve, defer.reject);

    return defer.promise;
  }

  function sendSubmit(obj, timeout) {
    var defer = $q.defer();

    callOnReady({
      testFunc: isRegistered,
      callFunc: 'sendObject',
      callParams: [obj, timeout]
    }).then(defer.resolve, defer.reject);

    return defer.promise;
  }

  var on = function on(platform, type, func) {
    callbacks[type][platform] = func;
  };

  return {
    connect: connect,
    register: register,
    isConnected: isConnected,
    isRegistered: isRegistered,
    set: sendSet,
    submit: sendSubmit,
    on: on
  };
}]).


/**
 * emitters
 */
run(['$rootScope',
function ($rootScope) {
  $rootScope.$on('showModalSockethubSettings', function(event, args) {
    backdrop_setting = true;
    if ((typeof args === 'object') && (typeof args.locked !== 'undefined')) {
      if (args.locked) {
        backdrop_setting = "static";
      }
    }
    $("#modalSockethubSettings").modal({
      show: true,
      keyboard: true,
      backdrop: backdrop_setting
    });
  });

  $rootScope.$on('closeModalSockethubSettings', function(event, args) {
    $("#modalSockethubSettings").modal('hide');
  });
}]).


directive('sockethubSettings', ['SH', 'SockethubSettings', '$rootScope',
function (SH, settings, $rootScope) {
  return {
    restrict: 'A',
    template: '<div id="modalSockethubSettings" class="modal hide fade">' +
              '  <div class="modal-header">' +
              '    <img data-ng-src="{{ settings.env.logo }}" width="200" ng-cloak/>' +
              '  </div>' +
              '  <div class="modal-body">' +
              '    <form name="settingsSockethub" class="form-horizontal" novalidate>' +
              '      <fieldset>' +
              '        <div class="control-group">' +
              '          <label for="host" class="control-label">Hostname</label>' +
              '          <div class="controls">' +
              '            <input type="text" class="required input-large" name="host" placeholder="Enter hostname..." ng-model="settings.conn.host" required>' +
              '          </div>' +
              '        </div>' +
              '        <div class="control-group">' +
              '          <label for="port" class="control-label">Port</label>' +
              '          <div class="controls">' +
              '            <input type="text" class="required input-small" name="port" placeholder="Enter port..." ng-model="settings.conn.port" required>' +
              '          </div>' +
              '        </div>' +
              '        <div class="control-group">' +
              '          <label for="path" class="control-label">Path</label>' +
              '          <div class="controls">' +
              '            <input type="text" class="required input-large" name="path" placeholder="Enter path (if any)..." ng-model="settings.conn.path">' +
              '          </div>' +
              '        </div>' +
              '        <div class="control-group">' +
              '          <label for="tls" class="control-label">TLS</label>' +
              '          <div class="controls checkbox-control">' +
              '            <input type="checkbox" name="tls" ng-model="settings.conn.tls">' +
              '          </div>' +
              '        </div>' +
              '        <div class="control-group">' +
              '          <label for="secret" class="control-label">Secret</label>' +
              '          <div class="controls">' +
              '            <input type="text" class="required input-xlarge" name="secret" placeholder="Enter secret..." ng-model="settings.conn.secret" required>' +
              '          </div>' +
              '        </div>' +
              '        <div class="control-group">' +
              '          <div class="controls">' +
              '            <button ng-click="save(settings.conn)" ng-disabled="!settings.verify(\'conn\', settings.conn) || saving">Submit</button>' +
              '          </div>' +
              '        </div>' +
              '      </fieldset>' +
              '    </form>' +
              '    <p></p>' +
              '    <div class="message-container">' +
              '      <div message></div>' +
              '    </div>' +
              '  </div>' +
              '  <div class="modal-footer">' +
              '  </div>' +
              '</div>',
    link: function (scope) {
      scope.saving = false;
      scope.settings = settings;
      scope.save = function (cfg) {
        scope.saving = true;
        /*$rootScope.$broadcast('message', {
              type: 'clear'
        });*/
        settings.save('conn', cfg);
        $rootScope.$broadcast('message', {
              message: 'attempting to connect to sockethub',
              type: 'info',
              timeout: false
        });
        SH.connect({register: true}).then(function () {
          scope.saving = false;
          console.log('connected to sockethub');
          $rootScope.$broadcast('message', {
                message: 'connected to sockethub',
                type: 'success',
                timeout: true
          });
          $("#modalSockethubSettings").modal('hide');
        }, function (err) {
          scope.saving = false;
          console.log('error connection to sockethub: ', err);
          $rootScope.$broadcast('message', {
                message: err,
                type: 'error',
                timeout: false
          });
        });
      };
    }
  };
}]);