all: pdfs font-list

pdfs: $(wildcard tmp/*.pdf)

%.pdf: %.out
	@gropdf -d < $^ > $@


font-list := test/fixtures/pdf-fonts
font-list: $(font-list).pdf

$(font-list).pdf: $(font-list).roff
	@ groff -Tpdf -Z $(if $(VERBOSE),-rV1) $< \
	| tee $(font-list).out \
	| gropdf -d > $@


watch = watchman -- trigger . $(1) '$(2)' -- make $(1)

watch:
	@$(call watch,pdfs,tmp/*.out)
	@$(call watch,font-list,$(font-list).roff)

unwatch:
	@watchman -- watch-del .

.PHONY: watch unwatch
