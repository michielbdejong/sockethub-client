
= Sockethub Client

This library handles all the nitty-gritty details of talking to your
[sockethub](http://sockethub.org/).

[![Build Status](https://secure.travis-ci.org/sockethub/sockethub-client.png)](http://travis-ci.org/sockethub/sockethub-client)

== Getting started

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
```

== Using sockethub-client with an AMD loader, such as [RequireJS](requirejs.org)

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

