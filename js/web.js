"use strict";
const $ = s => document.querySelector(s);

// Toolbar
const toolbar     = $("#toolbar");
const spreadSize  = $("#spread-size");
const zoomAmount  = $("#zoom-amount");
const bookmarks   = $("#bookmarks");
const noBookmarks = bookmarks[0];

$("#open-editor").addEventListener("click", () => openEditor());
spreadSize.addEventListener("change", event => view.spreadSize = +spreadSize.value);
zoomAmount.addEventListener("change", event => view.panAndZoom.zoom = +zoomAmount.value);
bookmarks.addEventListener("change", event => view.goToAnchor(bookmarks.value));

function disableBookmarks(){
	bookmarks.appendChild(noBookmarks);
	bookmarks.disabled = true;
}

function updateBookmarks(){
	bookmarks.innerHTML = "";
	if(!view.renderer.bookmarks.length)
		disableBookmarks();
	else{
		bookmarks.disabled = false;
		for(const mark of view.renderer.bookmarks){
			addBookmark(mark);
			mark.children.map(child => addBookmark(child));
		}
	}
}

function addBookmark(mark){
	const opt = document.createElement("option");
	opt.value = mark.target;
	opt.textContent = "\u2003 ".repeat(mark.level - 1) + mark.title;
	bookmarks.appendChild(opt);
}


// Source editor
const overlay     = $("#overlay");
const editor      = $("#editor");
const editorInput = $("#editor-input");
let hasBeenOpened = false;
let previousInput = "";

function openEditor(){
	if(hasBeenOpened) return;
	overlay.hidden = false;
	hasBeenOpened = true;
	previousInput = editorInput.value;
	editorInput.focus();
	editorInput.select();
}

function closeEditor(save = false){
	editorInput.blur();
	overlay.hidden = true;
	hasBeenOpened = false;
	save
		? redraw()
		: (editorInput.value = previousInput);
}

$("#editor-update").addEventListener("click", () => closeEditor(true));
$("#editor-cancel").addEventListener("click", () => closeEditor());
window.addEventListener("keyup", event => {
	if(hasBeenOpened && 27 === event.keyCode)
		closeEditor();
});


// Initialise viewer
const view = new TroffView({parentElement: $("#viewport")});
redraw();
view.spreadSize = +spreadSize.value;
view.panAndZoom = new PanAndZoom({
	update: () => view.zoomLayer.style.transform = view.panAndZoom,
});
window.view = view;

function redraw(){
	view.load(editorInput.value);
	updateBookmarks();
}
