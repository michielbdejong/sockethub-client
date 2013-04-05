define([], function() {
  function extend(target) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      for(var key in source) {
        if(typeof(source[key]) === 'object' &&
           typeof(target[key]) === 'object') {
          extend(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    });
    return target;
  }

  return extend;
});