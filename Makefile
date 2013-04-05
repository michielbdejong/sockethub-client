
default: build

build:
	node_modules/.bin/r.js -o baseUrl=src name=sockethub-client out=sockethub-client.js

.PHONY: build default