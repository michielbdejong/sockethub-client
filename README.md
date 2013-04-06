
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

var sockethubClient = SockethubClient.connect('localhost', {
  register: {
    secret: "1234567890"
  }
});

sockethubClient.on('registered', function() {

  sockethubClient.ping().then(function(response) {
    console.log('sockethub responded after ' + response.offset + 'ms');
  });

});

### Events

Out of the box, `SockethubClient` implements these events:
* `connected` - Fired once the WebSocket connection is established (i.e. socket.onopen has been called)
* `disconnected` - Fired in case the WebSocket connection is closed (i.e. socket.onclose has been called)
* `failed` - Fired when the WebSocket connection couldn't be established for some reason (i.e. socket.onclose is called before socket.onopen has been called)
* `message` - Fired when the hub sends a message that isn't associated to a specific request.
* `unexpected-response` - Fired when the hub sends a message that looks like a response (i.e. has a "rid" attribute), but can't be associated with any known request.

On top of these, verbs may implement new events. For example, the "register" verb brings two additional events:
* `registered` - Fired when registration has succeeded
* `registration-failed` - Fired when registration has not succeeded. Will be called with the response object. Check "response.message" to get the error message sent by the hub.

## Using sockethub-client with an AMD loader, such as [RequireJS](requirejs.org)

Sockethub Client internally uses AMD to organize code. That means you can just
integrate the sockethub-client source tree into your project's source and use
your project's build system to integrate it.

Following these steps should 

* Clone the repository into your project

```
cd PROJECT_DIR
mkdir vendor/
git clone git://github.com/sockethub/sockethub-client.git vendor/sockethub-client
```

* (optionally) add an alias:

```javascript
require.config({
  loadPaths: {
    "sockethub-client": "vendor/sockethub-client/src/sockethub-client"
  }
});
```

* Next, require "sockethub-client":

```javascript
define(['sockethub-client'], function(SockethubClient) {

  SockethubClient.connect(...);

});
```

And you're good to go.

