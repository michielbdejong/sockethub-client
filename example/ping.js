
requirejs.config({
  baseUrl: '../src'
});

define(['sockethub'], function(sockethub) {

  var sockethubClient;

  var connectedWrapper = document.getElementById('connected');
  var disconnectedWrapper = document.getElementById('disconnected');
  var errorElement = document.getElementById('error');

  var sockethubConnectForm = document.getElementById('sockethub-connect');

  var pingListElement = document.getElementById('ping-list');
  var pingFormElement = document.getElementById('ping-form');

  disconnectedWrapper.style.display = 'block';

  // sockethub connection

  sockethubConnectForm.addEventListener('submit', function(event) {
    event.preventDefault();

    sockethubClient = sockethub.connect(event.target.uri.value);

    sockethubClient.on('connected', function() {
      console.log('connected!');
      errorElement.innerHTML = '';
      disconnectedWrapper.style.display = 'none';
      connectedWrapper.style.display = 'block';


      sockethubClient.register({
        secret: '1234567890'
      }).then(function() {
        console.log('registration complete');
      }, function(error) {
        console.log('registration failed!', error);
        errorElement.innerHTML = "Registration failed: " + error.message;
      });

    });

    sockethubClient.on('disconnected', function() {
      console.log('disconnected!');
      disconnectedWrapper.style.display = 'block';
      connectedWrapper.style.display = 'none';
    });

    sockethubClient.on('failed', function() {
      errorElement.innerHTML = "Failed to connect to sockethub! Check URL and make sure it's running.";
    });

    return false;
  });

  // ping form

  pingFormElement.addEventListener('submit', function(event) {
    event.preventDefault();

    var counter = 0;

    pingListElement.innerHTML = '';

    var pingCount = parseInt(event.target.count.value);
    var pingDelay = parseInt(event.target.delay.value);

    function displayResult(message) {
      var line = document.createElement('li');
      line.innerHTML = message;
      pingListElement.appendChild(line);
    }

    function sendPing() {
      sockethubClient.ping().then(function(result) {
        return "Ping succeeded after " + result.offset + "ms";
      }, function(result) {
        return "Ping failed after " + (result.offset||0) + "ms, with message: " + result.message;
      }).then(displayResult).then(function() {
        counter++;
        if(counter !== pingCount) {
          setTimeout(sendPing, pingDelay);
        } else {
          displayResult("All pings sent.");
        }
      });
    }

    sendPing();

    return false;
  });

});
