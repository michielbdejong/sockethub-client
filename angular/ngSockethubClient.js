angular.module('ngSockethubClient', []).


/**
 * default settings
 */
value('settings', {
  sockethub: function () {
    // figure out sockethub connect settings
    var settings = {
      host: 'localhost',
      port: '10550',
      path: '/sockethub',
      tls: false,
      secret: '1234567890'
    };

    return settings;
  }
}).


/**
 * factory: SH
 */
factory('SH', ['$rootScope', '$q', '$timeout', 'settings',
function ($rootScope, $q, $timeout, settings) {

  var sc;
  var callbacks = {
    'error': {},
    'message': {},
    'response': {},
    'close': {}
  };

  var config = settings;

  function existsConfig(p) {
    if (!p) {
      p = config;
    }
    if ((!p.host) && (p.host !== '') &&
        (!p.port) && (p.port !== '') &&
        (!p.path) && (p.path !== '') &&
        (!p.tls) && (p.tls !== '') &&
        (!p.secret) && (p.secret !== '')) {
      return true;
    } else {
      return false;
    }
  }

  function setConfig(p) {
    var defer = $q.defer();

    if (existsConfig(p)) {
      config = p;
      console.log('SH.setConfig: ' + p.host + ', ' + p.port + ', ' +
                                     p.path + ', TLS:' + p.tls +
                                     ', SECRET:' + p.secret);
      defer.resolve();
    } else {
      defer.reject('some config properties missing');
    }
    return defer.promise;
  }

  function isConnected() {
    if (sc) {
      return sc.isConnected();
    } else {
      return false;
    }
  }

  function isRegistered() {
    if (sc) {
      return sc.isRegistered();
    } else {
      return false;
    }
  }


  function callOnReady(p) {
    var defer = $q.defer();
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
        console.log('SH: delaying call 1s');
        $timeout(__call, 1000);
      }
    })();
    return defer.promise;
  }



  function connect() {
    var defer = $q.defer();
    var scheme = 'ws://';
    if (config.tls) {
      scheme = 'wss://';
    }
    SockethubClient.connect({
      host: scheme + config.host + ':' + config.port + config.path,
      confirmationTimeout: 3000   // timeout in miliseconds to wait for confirm
    }).then(function (connection) {
      sc = connection;
      console.log('CONNECTED [connected: '+sc.isConnected()+'] [registered: '+sc.isRegistered()+']');
      sc.on('message', function (data) {
        //console.log('SH received message');
        if ((data.platform) &&
            (callbacks['message'][data.platform])) {
          console.log('SH passing message to platform: '+data.platform);
          $rootScope.$apply(callbacks['message'][data.platform](data));
        }
      });
      sc.on('error', function (data) {
        console.log('SH received error: ', data);
        if ((data.platform) &&
            (callbacks['error'][data.platform])) {
          console.log('SH passing error to platform: '+data.platform);
          $rootScope.$apply(callbacks['error'][data.platform](data));
        }
      });
      sc.on('response', function (data) {
        console.log('SH received response: ', data);
        if ((data.platform) &&
            (callbacks['response'][data.platform])) {
          console.log('SH passing response to platform: '+data.platform);
          $rootScope.$apply(callbacks['response'][data.platform](data));
        }
      });
      sc.on('close', function (data) {
        console.log('SH received close: ', data);
        if ((data) && (data.platform) &&
            (callbacks[close][data.platform])) {
          console.log('SH passing close to platform: '+data.platform);
          $rootScope.$apply(callbacks['close'][data.platform](data));
        }
      });
      $rootScope.$apply(function () {
        defer.resolve();
      });
    }, function (err) { // sockethub connection failed
      $rootScope.$apply(function () {
        defer.reject(err);
      });
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
        secret: config.secret
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
      callFunc: 'submit',
      callParams: [obj, timeout]
    }).then(defer.resolve, defer.reject);

    return defer.promise;
  }


  var on = function on(platform, type, func) {
    callbacks[type][platform] = func;
  };


  return {
    config: config,
    existsConfig: existsConfig,
    setConfig: setConfig,
    connect: connect,
    register: register,
    isConnected: isConnected,
    isRegistered: isRegistered,
    set: sendSet,
    submit: sendSubmit,
    on: on
  };
}]);