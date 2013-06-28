/**
 * This file is part of sockethub-client.
 *
 * © 2013 Niklas E. Cathor (https://github.com/nilclass)
 * © 2013 Nick Jennings (https://github.com/silverbucket)
 *
 * sockethub-client is dual-licensed under either the MIT License or GPLv3 (at your choice).
 * See the files LICENSE-MIT and LICENSE-GPL for details.
 *
 * The latest version of sockethub-client can be found here:
 *   git://github.com/sockethub/sockethub-client.git
 *
 * For more information about sockethub visit http://sockethub.org/.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 */

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