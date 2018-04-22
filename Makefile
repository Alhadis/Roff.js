MIN = min
CSS = css/main.css css/web.css
JS  = js/main.js js/pan-and-zoom.js js/web.js

all: $(MIN)/all.css $(MIN)/all.js

$(MIN)/%.css: $(CSS)
	cleancss $^ > $@

$(MIN)/%.js: $(JS)
	uglifyjs $^ -m > $@
