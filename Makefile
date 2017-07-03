pdfs := $(wildcard tmp/*.pdf)

all: $(pdfs)

%.pdf: %.out
	@gropdf -d < $^ > $@

watch:;   @watchman -- trigger . _ 'tmp/*.out' -- make all
unwatch:; @watchman -- watch-del .

.PHONY: watch unwatch
