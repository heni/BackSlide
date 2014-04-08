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
const Time = Me.imports.timer;
const Utils = Me.imports.utils;
// Import translation stuff
const Gettext = imports.gettext.domain('backslide');
const _ = Gettext.gettext;

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
            icon_name: 'emblem-photos-symbolic',
            style_class: 'system-status-icon'
        });
        this._iconBox.add(this._iconIndicator);
        this.actor.add_actor(this._iconBox);
        this.actor.add_style_class_name('panel-status-button');

        // Add the Widgets to the menu:
        this.menu.addMenuItem(new Widget.LabelWidget(_("Up Next")));
        let next_wallpaper = new Widget.NextWallpaperWidget();
        wallpaper_control.setPreviewCallback(function(path){
            try {
                next_wallpaper.setNextWallpaper(path);
            } catch (e){
                /*
                 The wallpaper could not be loaded (either not existent or not an image). Therefor,
                 remove particularly it from the image-list.
                */
                wallpaper_control.removeInvalidWallpapers(path);
            }
        });
        this.menu.addMenuItem(next_wallpaper);
        let control = new Widget.WallpaperControlWidget();
        control.setOrderState(settings.isRandom());
        this.menu.addMenuItem(control);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let minutes = 0;
        let unit = _("minutes");
        if (settings.getDelay() > 60 ){
            minutes = Math.floor(settings.getDelay() / 60);
            unit = _("hours");
        } else {
            minutes = settings.getDelay();
        }
        let delay_slider_label = new Widget.LabelWidget(_("Delay (%d %s)").format(minutes, unit) );

        this.menu.addMenuItem(delay_slider_label);
        let delay_slider = new Widget.DelaySlider(settings.getDelay() );
        this.menu.addMenuItem(delay_slider);
        this.menu.addMenuItem(new Widget.OpenPrefsWidget(this.menu));

        // React on control-interaction:
        timer.setCallback(function(){
            wallpaper_control.next();
        });
        control.connect("next-wallpaper", function(){
            wallpaper_control.next();
            timer.restart();
        });

        control.connect("timer-state-changed", function(source, state){
            if (state.name === Widget.START_TIMER_STATE){
                timer.begin();
            } else if (state.name === Widget.STOP_TIMER_STATE){
                timer.stop();
            }
        });
        control.connect("order-state-changed", Lang.bind(this, function(source, state){
            if (state === true){
                wallpaper_control.shuffle();
            } else {
                wallpaper_control.order();
            }
            // Also write the new setting:
            settings.setRandom(state);
        }));

        // React on delay-change:
        delay_slider.connect('value-changed', function(){
            settings.setDelay(delay_slider.getMinutes());
            let minutes = delay_slider.getMinutes();

            global.log('Extension Slider value-changed: returned minutes = ' + minutes);

            let label_text;
            if (minutes > 60){
                label_text = _("Delay (%d %s)").format(Math.floor(settings.getDelay() / 60), _("hours"));
            } else {
                label_text = _("Delay (%d %s)").format(minutes, _("minutes"));
            }

            delay_slider_label.setText(label_text);
        });

        // TODO Widgets react on external changes of settings
    }
});

/**
 * Called when the extension is first loaded (only once)
 */
function init() {
    Utils.initTranslations();
    wallpaper_control = new Wall.Wallpaper();
    settings = new Pref.Settings();
    timer = new Time.Timer();
}

let wallpaper_control;
let settings;
let timer;
let menu_entry;

/**
 * Called when the extension is activated (maybe multiple times)
 */
function enable() {
    menu_entry = new BackSlideEntry();
    Main.panel.addToStatusArea('backslide', menu_entry);
    timer.begin();
}

/**
 * Called when the extension is deactivated (maybe multiple times)
 */
function disable() {
    menu_entry.destroy();
    timer.stop();
}
