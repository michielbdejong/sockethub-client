# Sockethub Client

This library handles all the nitty-gritty details of talking to your
[sockethub](http://sockethub.org/).

[![Build Status](https://secure.travis-ci.org/sockethub/sockethub-client.png)](http://travis-ci.org/sockethub/sockethub-client) [![Greenkeeper badge](https://badges.greenkeeper.io/michielbdejong/sockethub-client.svg)](https://greenkeeper.io/)

## Terms

sockethub-client is dual-licensed under either the [MIT License](https://github.com/sockethub/sockethub-client/raw/master/LICENSE-MIT) or [GPLv3](https://github.com/sockethub/sockethub-client/raw/master/LICENSE-GPL) (at your choice).

## Getting started

Include [sockethub-client.js](https://github.com/sockethub/sockethub-client/raw/master/sockethub-client.js) script:

```html
  <script src="sockethub-client.js"></script>
```

Create a client and wait for the "registered" event to fire:
```javascript

var sockethubClient = SockethubClient.connect({
  host: 'localhost',
  register: {
    secret: '1234567890'
  }
})

sockethubClient.on('registered', function() {
  // done!
  // you can start calling verbs now, such as...

  console.log('ping');
  sockethubClient.ping().then(function() {
    console.log('pong');
  }, function(response) {
    console.log('ping failed: ', response.message);
  });
});
```

You may also want to set up some error handlers:
```javascript
sockethubClient.on('failed', function() {
  console.error("Connection to sockethub failed!");
});

sockethubClient.on('disconnected', function() {
  console.error("Sockethub got disconnected!");
});
```

for more information, see:
[Quickstart](https://github.com/sockethub/sockethub-client/blob/master/doc/quickstart.md)


### Events

Out of the box, `SockethubClient` implements these events:
* `connected` - Fired once the WebSocket connection is established (i.e. socket.onopen has been called)
* `failed` - Fired when the WebSocket connection failed to be established
* `disconnected` - Fired when the WebSocket connection is closed (but it had been connected)
* `message` - Fired when the hub sends a message that isn't associated to a specific request.
* `unexpected-response` - Fired when a response is received that carries a "rid" attribute, but that "rid" isn't known to us. This is an error case (and probably indicates a bug in the corresponding sockethub platform).
* `registered` - Fired when `register` succeeds.
* `registration-failed` - Fired when `register` fails.

### Properties

The following properties are available for your use:
* `options` - This is the options object that was passed to `SockethubClient.connect`.
* `connected` - Boolean property reflecting the connection state of the socket.
* `registered` - Boolean property. Initially false, set to the result of the `register` command once that returns.


## Using sockethub-client with an AMD loader, such as [RequireJS](requirejs.org)

Currently the AMD module and the simple client are separate code-bases. For more info on using Sockethub with AMD see the doc here: [AMD](https://github.com/sockethub/sockethub-client/raw/master/doc/amd.md)
