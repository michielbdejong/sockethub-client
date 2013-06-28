##
# This file is part of sockethub-client.
#
# © 2013 Niklas E. Cathor (https://github.com/nilclass)
# © 2013 Nick Jennings (https://github.com/silverbucket)
#
# sockethub-client is dual-licensed under either the MIT License or GPLv3 (at your choice).
# See the files LICENSE-MIT and LICENSE-GPL for details.
#
# The latest version of sockethub-client can be found here:
#		git://github.com/sockethub/sockethub-client.git
#
# For more information about sockethub visit http://sockethub.org/.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
#
#

BUILD_OPTIONS = -o baseUrl=src name=vendor/almond include=sockethub-client wrap.startFile=build/start.frag wrap.endFile=build/end.frag

default: build

build: sockethub-client.js sockethub-client.min.js

sockethub-client.js:
	node_modules/.bin/r.js $(BUILD_OPTIONS) out=sockethub-client.js optimize=none

sockethub-client.min.js:
	node_modules/.bin/r.js $(BUILD_OPTIONS) out=sockethub-client.min.js optimize=uglify

doc:
	naturaldocs -i src -o html doc -p doc/.config

.PHONY: build default doc
