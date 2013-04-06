
default: build

build:
	node_modules/.bin/r.js -o baseUrl=src name=vendor/almond include=sockethub-client out=sockethub-client.js optimize=none

doc:
	naturaldocs -i src -o html doc -p doc/.config

.PHONY: build default