all: pdfs

pdf-fixtures := pdf-fonts.pdf pdf-large.pdf symbol-fonts.pdf symbol-list.pdf

pdfs: \
	$(wildcard tmp/*.pdf) \
	$(addprefix test/fixtures/,$(pdf-fixtures))

tmp/%.pdf: tmp/%.out
	@gropdf -d < $^ > $@

test/fixtures/%.pdf: test/fixtures/%.roff
	@ groff -Tpdf -eZ $(if $(VERBOSE),-rV1) $< \
	| tee $(basename $@).out \
	| gropdf -d > $@

test/fixtures/pdf-large.pdf: test/fixtures/pdf-large.out
	@ gropdf -d < $^ > $@

watch = watchman -- trigger . $(1) $(2) -- make $(1)

watch:;   $(call watch,pdfs,'tmp/*.out' $(patsubst %,'test/fixtures/*.%',roff out))
unwatch:; @watchman -- watch-del .

.PHONY: watch unwatch
