// Import global libraries
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
// Import own libs:
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Widget = Me.imports.widgets;
const Wall = Me.imports.wallpaper;
const Pref = Me.imports.settings;

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
        let control = new Widget.WallpaperControlWidget(
            settings.isRandom()
        );
        this.menu.addMenuItem(control);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // React on control-interaction:
        control.connect("next-wallpaper", function(){
            wallpaper_control.next(function(next){
                // TODO show the next wallpaper to be displayed.
            });
        });
        control.connect("timer-state-changed", function(source, state){
            if (state.name === Widget.START_TIMER_STATE){
                // TODO Start/Restart the timer.
            } else if (state.name === Widget.STOP_TIMER_STATE){
                // TODO Stop the widget-timer.
            }
        });
        control.connect("order-state-changed", Lang.bind(this, function(source, state){
            if (state.name === Widget.RANDOM_STATE){
                // TODO Shuffle the wallpaper-list
            } else if (state.name === Widget.LOOP_STATE){
                // TODO Order the wallpaper-list
            }
            // Also write the new setting:
            settings.setRandom((state.name === Widget.RANDOM_STATE));
        }));
    }
});

/**
 * Called when the extension is first loaded (only once)
 */
function init() {
    wallpaper_control = new Wall.Wallpaper();
    settings = new Pref.Settings();
}

let wallpaper_control;
let settings;
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
