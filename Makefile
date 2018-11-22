ENTRY = lib/index
UMD_NAME = Roff

all: lint build test

# Generate a compressed UMD bundle from ESM source
build: lib/index.js

$(ENTRY).js: $(ENTRY).mjs
	npx rollup \
		--format umd \
		--sourcemap $@.map \
		--name $(UMD_NAME) \
		--input $? \
		--file $@
	node -e '\
		const fs = require("fs"); \
		const map = JSON.parse(fs.readFileSync("$@.map", "utf8")); \
		delete map.sourcesContent; \
		fs.writeFileSync("$@.map", JSON.stringify(map));'
	npx terser \
		--keep-classnames \
		--mangle \
		--compress \
		--source-map "content=$@.map,url=$(@F).map" \
		--output $@ $@


# Wipe generated build targets
clean:
	rm -f $(ENTRY).js*

.PHONY: clean


# Check source for style and syntax errors
lint:
	npx eslint --ext mjs,js .

.PHONY: lint


# Run unit-tests
test: build
	npx mocha test

.PHONY: test
