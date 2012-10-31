/**
  * This is where all the widgets for the menu life.
  */
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

/**
 * Simple test-entry.
 * @type {Lang.Class}
 */
const TestItem = new Lang.Class({
    Name: "TestItem",
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(){
        this.parent();

        this._label = new St.Label({
            text: "Test Item is here!"
        });
        this.addActor(this._label);
    }
});