ENTRY = lib/index
UMD_NAME = Roff

all: lint umd test

# Generate a compressed UMD bundle from ESM source
umd: lib/index.js

$(ENTRY).js: lib/*/*.mjs lib/*/*/*.mjs
	npx rollup \
		--format umd \
		--preferConst \
		--sourcemap $@.map \
		--name $(UMD_NAME) \
		--input $(ENTRY).mjs \
		--file $@
	node -e '\
		const fs = require("fs"); \
		const map = JSON.parse(fs.readFileSync("$@.map", "utf8")); \
		delete map.sourcesContent; \
		fs.writeFileSync("$@.map", JSON.stringify(map));'
	sed -i~ -e "s/await import(/require(/g" $@ && rm -f "$@~"
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
test: umd
	npx mocha test/?-*.js

.PHONY: test
