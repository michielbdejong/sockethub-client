# General overview for using the Sockethub client

## connect

You can either pass the connection options via an object...

```javascript
  var sockethubClient = SockethubClient.connect({
    host: 'localhost', // only required option
    // these are the defaults:
    port: 10550,
    ssl: false,
    path: '/sockethub'
  });
```

...or via a URI string:


```javascript
  var sockethubClient = SockethubClient.connect('ws://localhost:10550/sockethub');
```

When passing the URI as a string, you can still specify options:


```javascript
  var sockethubClient = SockethubClient.connect('ws://localhost:10550/sockethub', {
    some: 'option'
  });
```


## register

In order to actually use the sockethub, unless you passed a `register` option in the `connect` call, you first need to wait for the `connected` event, and then send the "register" command, passing along your sockethub secret:

```javascript
sockethubClient.register({ secret: '1234567890' })

sockethubClient.on('registered', function() {
  // now you're registered.
});

sockethubClient.on('registration-failed', function(response) {
  // something went wrong. inspect the response to find out what.
});
```


## set
To set credentials for the platforms we will want to use

```javascript
  sockethubClient.set('facebook', {
    credentials: {
      me: {
        access_token: access_token
      }
    }
  }).then(function () {
    console.log('successfully set credentials for facebook account');
  }, function (err) {
    console.log('error setting credentials for facebook :( ', err);
  });
```


## sendObject
generic function to send data to sockethub

```javascript
  sockethubClient.sendObject({
    platform: 'facebook',
    verb: 'post',
    actor: { address: 'me' },
    target: [{ address: 'friendsusername' }],
    object: {
      text: 'Hello facebook, love Sockethub'
    }
  }).then(function (response) {
    console.log('post sucessful, heres the response: ', response);
  }, function (err) {
    console.log('oh no! ', err);
  });
```

