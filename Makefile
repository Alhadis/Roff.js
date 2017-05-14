all: preview-tty.html $(wildcard fixtures/*.pdf)

.PHONY: clean watch

clean:
	@rm -fv $(wildcard fixtures/*.pdf)
	@rm -fv $(wildcard fixtures/*.ps)

watch:;   watchman -- trigger . _ -P '\.(pic|out)$$' -- make all
unwatch:; watchman -- watch-del .


# =[ CANVAS ]===========================================================
fixtures/%.pdf: fixtures/%.out
	@gropdf $^ > $@

fixtures/%.out: fixtures/%.pic
	@pic $^ | groff -Z -Tpdf > $@


# =[ TTY ]==============================================================
css := '\
	html{\
		background: black;\
		color: white\
	}\
	a{\
		color: inherit;\
		text-decoration: none\
	}\
	pre{\
		font: 10px Menloco, Monaco, Menlo, monospace;\
		font-variant-ligatures: none\
	}'

preview-tty.html: fixtures/groff_char.out
	@\
	printf %s '<!DOCTYPE html>' > $@; \
	printf %s '<html lang="en"><head>'  >> $@; \
	printf %s '<meta charset="UTF-8"/>' >> $@; \
	printf %s '<title>Preview</title>'  >> $@; \
	printf %s '<style>'$(css)'</style>' >> $@; \
	echo '</head><body><pre>' >> $@; \
	./test-tty.js >> $@; \
	echo '</pre></body></html>' >> $@;

fixtures/groff_char.out:
	grog --run -Tps -Z $$(man -w $*) > $@

fixtures/tty-box.out: fixtures/tty-box.pic
	@pic $^ | groff -Z -Tutf8 > $@
