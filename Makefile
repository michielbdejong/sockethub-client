
default: build

build:
	node_modules/.bin/r.js -o baseUrl=src name=vendor/almond include=sockethub-client out=sockethub-client.js optimize=none wrap.startFile=build/start.frag wrap.endFile=build/end.frag

doc:
	naturaldocs -i src -o html doc -p doc/.config

.PHONY: build default doc
