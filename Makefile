all: preview-tty.html

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

preview-tty.html: $(wildcard lib/*.js)
	@rm -f $@; \
	printf %s '<!DOCTYPE html>' > $@; \
	printf %s '<html lang="en"><head>'  >> $@; \
	printf %s '<meta charset="UTF-8"/>' >> $@; \
	printf %s '<title>Preview</title>'  >> $@; \
	printf %s '<style>'$(css)'</style>' >> $@; \
	echo '</head><body><pre>' >> $@; \
	./test.js >> $@; \
	echo '</pre></body></html>' >> $@;

clean:; @rm -f preview-tty.html
.PHONY: clean
