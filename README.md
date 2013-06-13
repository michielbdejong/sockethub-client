
# Sockethub Client

This library handles all the nitty-gritty details of talking to your
[sockethub](http://sockethub.org/).

[![Build Status](https://secure.travis-ci.org/sockethub/sockethub-client.png)](http://travis-ci.org/sockethub/sockethub-client)

## Getting started

Include [sockethub-client.js](https://github.com/sockethub/sockethub-client/raw/master/sockethub-client.js) script:

```html
  <script src="sockethub-client.js"></script>
```

Create a client and wait for the "registered" event to fire:
```javascript

var sc;
var sockethubClient = SockethubClient.connect({
  host: 'ws://localhost:10550',
}).then(function (connection) { // connected
  var sc = connection;
  sc.register({
    secret: "1234567890"
  }).then(initListeners, function () {
    console.log('failed registering: ', e);
  });
}, function (e) {
  console.log('failed connecting: ', e);
});

function initListeners() {
  sc.on('message', function (data) {
    console.log('SH received message');
  });
  sc.on('error', function (data) {
    console.log('SH received error: ', data);
  });
  sc.on('response', function (data) {
    console.log('SH received response: ', data);
  });
  sc.on('close', function (data) {
    console.log('SH received close: ', data);
  });
}
```

for more information, see:
[Quickstart](https://github.com/sockethub/sockethub-client/raw/master/doc/quickstart.md)


### Events

Out of the box, `SockethubClient` implements these events:
* `connected` - Fired once the WebSocket connection is established (i.e. socket.onopen has been called)
* `close` - Fired in case the WebSocket connection is closed (i.e. socket.onclose has been called)
* `error` - Fired when the client encounters an error of some sort.
* `message` - Fired when the hub sends a message that isn't associated to a specific request.
* `response` - Fired when the hub sends a message that looks like a response (i.e. has a "rid" attribute), but can't be associated with any known request.


## Using sockethub-client with an AMD loader, such as [RequireJS](requirejs.org)

Currently the AMD module and the simple client are separate code-bases. For more info on using Sockethub with AMD see the doc here: [AMD](https://github.com/sockethub/sockethub-client/raw/master/doc/amd.md)
