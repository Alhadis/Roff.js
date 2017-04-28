all: $(addprefix fixtures/perlre.,out pdf ps) preview-tty.html

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

preview-tty.html: fixtures/groff_char.out $(wildcard lib/*.js)
	@\
	printf %s '<!DOCTYPE html>' > $@; \
	printf %s '<html lang="en"><head>'  >> $@; \
	printf %s '<meta charset="UTF-8"/>' >> $@; \
	printf %s '<title>Preview</title>'  >> $@; \
	printf %s '<style>'$(css)'</style>' >> $@; \
	echo '</head><body><pre>' >> $@; \
	./test-tty.js >> $@; \
	echo '</pre></body></html>' >> $@;

fixtures/circles-%.out: fixtures/circles-%.pic
	@pic < $^ | groff -Z > $@; \
	grops < $@ > fixtures/circles-$*.ps

clean:
	@rm -f preview-tty.html
	@rm -f $(wildcard fixtures/*.pdf)
	@rm -f $(wildcard fixtures/*.ps)
.PHONY: clean

fixtures/%.out:; grog --run -Tps -Z $$(man -w $*) > $@
fixtures/%.pdf:; grog --run -Tpdf   $$(man -w $*) > $@
fixtures/%.ps:;  grog --run -Tps    $$(man -w $*) > $@
