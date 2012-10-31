// Import global libraries
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
// Import own libs:
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Widget = Me.imports.widgets;

/**
 * The new entry in the gnome3 status-area.
 * @type {Lang.Class}
 */
const BackSlideEntry = new Lang.Class({
    Name: 'BackSlideEntry',
    Extends: PanelMenu.Button,

    _init: function(){
        // Attach to status-area:
        this.parent(0.0, 'backslide');
        // Add the Icon:
        this.actor.show();
        this._iconBox = new St.BoxLayout();
        this._iconIndicator = new St.Icon({
            icon_name: 'emblem-photos',
            style_class: 'system-status-icon'
        });
        this._iconBox.add(this._iconIndicator);
        this.actor.add_actor(this._iconBox);
        this.actor.add_style_class_name('panel-status-button');

        // Add the Widgets to the menu:
        this.menu.addMenuItem(new Widget.TestItem());
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(new Widget.TestItem());
    }
});

/**
 * Called when the extension is first loaded (only once)
 */
function init() {

}

let menu_entry;

/**
 * Called when the extension is activated (maybe multiple times)
 */
function enable() {
    menu_entry = new BackSlideEntry();
    Main.panel.addToStatusArea('backslide', menu_entry);
}

/**
 * Called when the extension is deactivated (maybe multiple times)
 */
function disable() {
    menu_entry.destroy();
}
