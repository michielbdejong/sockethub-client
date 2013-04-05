
default: build

build:
	node_modules/.bin/r.js -o baseUrl=src name=vendor/almond include=sockethub-client out=sockethub-client.js optimize=none

.PHONY: build default