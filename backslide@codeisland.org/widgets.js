/*
 * Copyright (C) 2012 Lukas Knuth
 *
 * This file is part of Backslide.
 *
 * Backslide is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Backslide is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Backslide.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
  * This is where all the widgets for the menu life.
  */
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const Util = imports.misc.util;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Slider = imports.ui.slider;

const Gettext = imports.gettext.domain('backslide');
const _ = Gettext.gettext;



/**
 * A Button to open the "gnome-shell-extension-prefs"-tool to configure this extension.
 * @type {Lang.Class}
 */
var OpenPrefsWidget = GObject.registerClass({},
class OpenPrefsWidget extends GObject.Object {

    /**
     * Creates a new Button to open the prefs of this extension.
     * @param menu the menu to be toggled when the button is pressed.
     * @private
     */
    _init(menu){
        this.item = new PopupMenu.PopupBaseMenuItem();
        this._menu = menu;
        // The Label:
        this._label = new St.Label({
            text: _("Manage Wallpapers")
        });

        this.item.actor.add_child(this._label);
        this._label.span = -1;
        this._label.align = St.Align.MIDDLE;

        // Connect:
        this.item.connect('activate', Lang.bind(this, this._onClick));
    }

    _onClick(){
        this.launchExtensionPrefs("backslide@codeisland.org");
        this._menu.toggle(); // Toggle the menu.
    }

    /**
     * <p>Launches the "gnome-shell-extension-prefs"-tool with the settings for the extension
     *  with the given uuid.</p>
     */
    launchExtensionPrefs(uuid) {
        Util.trySpawnCommandLine("gnome-shell-extension-prefs "+uuid);
    }
});

// -------------------------------------------------------------------------------

/**
 * Shows a preview of the next wallpaper to be set.
 * @type {Lang.Class}
 */
var NextWallpaperWidget = GObject.registerClass({},
class NextWallpaperWidget extends GObject.Object {

    _init(){
        this._overlay_idle_id = 0;
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        // Overall Box:
        this._box = new St.BoxLayout({
            vertical: true,
            height: 200
        });

        this.item.actor.add_child(this._box)
        this._box.span = -1;
        this._box.align = St.Align.MIDDLE;

        // The computer-picture:
        let screen_image = Me.dir.get_child('img').get_child("screen.png");
        if (screen_image.query_exists(null)){
            // If the theme-independent image is there, use it...
            this._icon = new Clutter.Texture({
                filter_quality: Clutter.TextureQuality.HIGH
            });
            this._icon.set_from_file(screen_image.get_path());
        } else {
            // ... otherwise, fall back on the theme-image. Might look ugly, see Issue #10
            this._icon = new St.Icon({
                icon_name: "video-display",
                icon_size: 220
            });
            if (St.IconType !== undefined){
                this._icon.icon_type = St.IconType.FULLCOLOR; // Backwards compatibility with 3.4
            }
        }


        this._icon_bin = new St.Bin({
            child: this._icon,
            y_fill: false,  // The icon has much space on top/bottom,
            height: 180     //  therefor, crop it.
        });
        this._box.add(this._icon_bin);
        // The next Wallpaper ("in" the screen):
        this._wallpaper = new St.Bin({
            style_class: "overlay"
        });
        this._box.add(this._wallpaper);
        // The texture for the wallpapers:
        this._texture = new Clutter.Texture({
            filter_quality: Clutter.TextureQuality.HIGH,
            width: 178,
            height: 106
        });
        this._wallpaper.set_child(this._texture);

        // Do the trick for overlapping:
        // See https://mail.gnome.org/archives/gnome-shell-list/2012-August/msg00077.html
        let box = this._wallpaper;
        this._overlay_idle_id = Mainloop.idle_add(function () {
            box.anchor_y = 161;
            return false;
        });
    }

    /**
     * Load the next image to be set as the wallpaper into the widget.
     * @param path the path to the image to preview.
     */
    setNextWallpaper(path){
        if (this._texture.set_from_file(path) === false){
            // Couldn't load the image!
            throw "Image at '"+path+"' couldn't be found. It will be removed from the list...";
        }
    }

    destroy() {
        Mainloop.source_remove(this._overlay_idle_id);
        this._wallpaper.destroy();
        this._wallpaper = null;

        // Call the base-implementation:
        PopupMenu.PopupBaseMenuItem.prototype.destroy.call(this.item);
    }
});

// -------------------------------------------------------------------------------

const STOP_TIMER_STATE = "stop";
const START_TIMER_STATE = "start";
/**
 * The whole widget including the loop/random, pause/play and next buttons.
 * This widget will emit multiple signals to be handled in a central place:
 * <ul>
 *     <li>"next-wallpaper" -> Emitted, when the next-button was pressed.</li>
 *     <li>"timer-state-changed" -> Emitted, when the timers state changed (start/stop)</li>
 *     <li>"order-state-changed" -> Emitted, when the wallpaper-order changes</li>
 * </ul>
 * @type {Lang.Class}
 */
var WallpaperControlWidget = GObject.registerClass({
    Signals: { 'next-wallpaper': {},
               'timer-state-changed': { param_types: [ GObject.TYPE_BOOLEAN ] },
               'order-state-changed': { param_types: [ GObject.TYPE_BOOLEAN ] } }
},
class WallpaperControlWidget extends GObject.Object {

    /**
     * Creates a new control-widget.
     * @private
     */
    _init(nextWallpaper, timerStateChanged, orderStateChanged){
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        // Add the layout:
        this.box = new St.BoxLayout({
            style_class: 'controls', // Check the stylesheet.css file!
            style: 'padding-left: 47px;'
        });

        this.item.actor.add(this.box, {
          expand: true
        });

        // Add the buttons:
        this._order_button = new ControlToggleButton(
            "media-playlist-shuffle", orderStateChanged
        );
        this.box.add_actor(this._order_button.actor);
        let timer_button = new StateControlButton(
            [
                {
                    name: STOP_TIMER_STATE,
                    icon: "media-playback-pause"
                },{
                    name: START_TIMER_STATE,
                    icon: "media-playback-start"
                }
            ], function(state) {
              timerStateChanged(state.name === START_TIMER_STATE);
            }
        );
        timer_button.setState(STOP_TIMER_STATE);
        this.box.add_actor(timer_button.actor);
        let skipButton = new ControlButton("media-skip-forward");
        let self = this;
        skipButton.actor.connect('clicked', function() {
          nextWallpaper();
        });
        this.box.add_actor(skipButton.actor);
    }

    /**
     * Set the state of the order-button.
     * @param isRandom whether the wallpaper-order is random or not.
     */
    setOrderState(isRandom){
        this._order_button.setState(isRandom);
    }

    /**
     * Emits the "order-state-changed"-signal, to be caught upstream.
     * @param state the state of the wallpaper-order.
     * @private
     */
    _orderStateChanged(state){
        this.emit("order-state-changed", state);
    }

    /**
     * Emits the "next-wallpaper"-signal, to be caught upstream.
     * @private
     */
    _nextWallpaper(){
        global.log("_nextWallpaper this ");
        this.emit("next-wallpaper"); // Custom signal
    }

    /**
     * Emits the "timer-state-changed"-signal, to be caught upstream.
     * @param state the state of the widget. See STOP_WIDGET_TIMER_STATE and START_WIDGET_TIMER_STATE
     * @private
     */
    _timerStateChanged(state){
        this.emit("timer-state-changed", );
    }

});

/**
 * A simple button, styled to be used inside the "WallpaperControlWidget".
 * @type {Lang.Class}
 */
var ControlButton = GObject.registerClass({},
class ControlButton extends GObject.Object {

    /**
     * Creates a new button for use inside "WallpaperControlWidget"
     * @param icon the name of the icon, see http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html
     * @param callback the callback for the "click"-event.
     * @private`
     */
    _init(icon, callback){
        this.icon = new St.Icon({
            icon_name: icon + "-symbolic", // Get the symbol-icons.
            icon_size: 20
        });

        this.actor = new St.Button({
            style_class: 'notification-icon-button control-button', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons
    }

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon(icon){
        this.icon.icon_name = icon+'-symbolic';
    }
});

/**
 * A "ControlButton" which also maintains multiple states with different icons.
 * For every state-change (click) the given callback-function will be called with
 *  a parameter, indicating the current (new) state.
 * @type {Lang.Class}
 */
var StateControlButton = GObject.registerClass({},
class StateControlButton extends GObject.Object {

    /**
     * <p>Create a new, stateful button for use inside "WallpaperControlWidget"</p>
     * <p>For the different states, an array of objects is used. The object will be passed
     *  as an argument to the given callback-function, when the state changes. Mandatory elements
     *  are: "icon", "name".</p>
     * <code>
     *     {
     *       name: "State-name",
     *       icon: "icon-name for the state"
     *     }
     * </code>
     * @param states an array of objects with information about the possible states.
     * @param callback the callback-function for the "click"-signal.
     * @private
     */
    _init(states, callback){
       this._state_index = 0;
       this._states = [];
       this._callback = null;
       this._locked = false;
        // Validate:
        if (states.length < 2){
            throw RangeError("The 'states'-array should contain 2 or more elements.");
        }
        for (let i in states){
            if (states[i].icon === undefined || states[i].name === undefined){
                throw TypeError("objects in the 'states'-array need an 'icon' and 'name'-property!");
            }
        }
        // Initialize:
        this._states = states;
        this._state_index = 0;

        this.icon = new St.Icon({
            icon_name: this._states[this._state_index].icon + "-symbolic", // Get the symbol-icons.
            icon_size: 20
        });

        this.actor = new St.Button({
            style_class: 'notification-icon-button control-button', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons

        if (callback !== undefined || callback !== null){
            this._callback = callback;
        }
        this.actor.connect('clicked', Lang.bind(this, this._clicked));
    }

    /**
     * Called when the stateful button is clicked.
     * FOR INTERNAL USE ONLY!
     * @private
     */
    _clicked(){
        // Call-Back:
        if (this._callback !== null){
            this._locked = true;
            this._callback( this._states[this._state_index] );
            this._locked = false;
        }
        // Set new state:
        if (this._state_index+1 >= this._states.length){
            this._state_index = 0;
        } else {
            this._state_index++;
        }
        // change Icon.
        this.setIcon( this._states[this._state_index].icon );
    }

    /**
     * Set the state of this button. This will NOT trigger the callback function!
     * @param state the state-name of the button.
     */
    setState(state){
        if (state === this._states[this._state_index]){
            return; // It's already this state.
        }
        if (this._locked){
            return; // Locked to prevent concurrent changes.
        }
        for (let i in this._states){
            if (this._states[i].name === state){
                this._state_index = i;
                this.setIcon(this._states[i].icon);
            }
        }
    }

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon(icon){
        this.icon.icon_name = icon+'-symbolic';
    }

});

/**
 * A "ControlButton" which can be active or inactive. To be used in "WallpaperControlWidget".
 * @type {Lang.Class}
 */
var ControlToggleButton = GObject.registerClass({},
class ControlToggleButton extends GObject.Object {


    /**
     * Create a new toggle button.
     * @param icon the icon to use for the button
     * @param callback the click-callback for the button. The functions first parameter will be
     *  the new state of the button.
     * @private
     */
    _init(icon, callback){
        this.icon = new St.Icon({
            icon_name: icon + "-symbolic", // Get the symbol-icons.
            icon_size: 20
        });

        this.actor = new St.Button({
            toggle_mode: true,
            style_class: 'notification-icon-button untoggled', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons

        if (callback != undefined || callback != null){
            this._callback = callback;
        }
        this.actor.connect('clicked', Lang.bind(this, this._onToggle));
    }

    _onToggle(){
        // Glow the image:
        if (this.actor.checked){
            this.actor.style_class = 'notification-icon-button';
        } else {
            this.actor.style_class = 'notification-icon-button untoggled';
        }
        // Trigger callback:
        if (this._callback !== null){
            this._callback(this.actor.checked);
        }
    }

    /**
     * Set the state of the button (without triggering the callback).
     * @param on whether the button is toggled on or not.
     */
    setState(on){
        if (typeof on === "boolean"){
            this.actor.checked = on;
            if (on){
                this.actor.style_class = 'notification-icon-button';
            }
        }
    }
});

// -------------------------------------------------------------------------------

// borrowed from: https://github.com/eonpatapon/gnome-shell-extensions-mediaplayer
var SliderItem = GObject.registerClass({},
class SliderItem extends GObject.Object {

    _init(value) {
        this.item = new PopupMenu.PopupBaseMenuItem();

        var layout = new Clutter.TableLayout();
        this._box = new St.Widget({
							style_class: 'slider-item',
							layout_manager: layout});

        this._slider = new Slider.Slider(value);

        layout.pack(this._slider.actor, 2, 0);
        this.item.actor.add(this._box, {span: -1, expand: true});
    }

    setValue(value) {
        if (this._slider.setValue)
          this._slider.setValue(value);
        else
          this._slider.value = value;
    }

    getValue() {
        return this._slider._getCurrentValue();
    }

    setIcon(icon) {
        this._icon.icon_name = icon + '-symbolic';
    }

    connect(signal, callback) {
        this._slider.connect(signal, callback);
    }
});


/**
 * Widget for setting the delay for the next Wallpaper-change.
 * @type {Lang.Class}
 */


var DelaySlider = GObject.registerClass({},
class DelaySlider extends SliderItem {

    /**
     * Construct a new Widget.
     * @private
     */
    _init(minutes){
        super._init(0); // value MUST be specified!
        this._MINUTES_MAX = 59;
        this._MINUTES_MIN = 5;
        this._HOURS_MAX = 48;
        this._HOURS_MIN = 1;
        this.setMinutes(minutes); // Set the real value.
    }

    /**
     * Set the value of the slider to x minutes.
     * @param minutes the value in minutes between _MINUTES_MAX and _MINUTES_MIN
     */
    setMinutes(minutes){
        // Validate:
        if (isNaN(minutes) || minutes < this._MINUTES_MIN || minutes > this._HOURS_MAX*60){
            throw TypeError("'minutes' should be an integer between "
                +this._MINUTES_MIN+" and "+this._HOURS_MAX*60);
        }

        let value = 0;
        if (minutes <= this._MINUTES_MAX){
            value = (minutes - this._MINUTES_MIN) / (this._MINUTES_MAX - this._MINUTES_MIN) / 2;
        } else {
            value = (((minutes / 60) - this._HOURS_MIN) / (this._HOURS_MAX - this._HOURS_MIN) / 2) + 0.5;
        }

        this.setValue(value);
    }

    /**
     * Get the value in minutes from the slider.
     * @return int the value in minutes.
     */
    getMinutes(){
        let minutes = 0;
        if (this.getValue() < 0.5) {
            minutes = this._MINUTES_MIN + (this.getValue() * 2) * (this._MINUTES_MAX - this._MINUTES_MIN);
        } else {
            minutes = (this._HOURS_MIN + (this.getValue() - 0.5) * 2 * (this._HOURS_MAX - this._HOURS_MIN)) * 60;
        }

        return (minutes < this._MINUTES_MIN) ? this._MINUTES_MIN : Math.floor(minutes);
    }
});

// -------------------------------------------------------------------------------

/**
 * A simple label which only displays the given text.
 * @type {Lang.Class}
 */
var LabelWidget = GObject.registerClass({},
class LabelWidget extends GObject.Object {

    _init(text){
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        this._label = new St.Label({
            text: text
        });

        this.item.actor.add_child(this._label);
    }

    /**
     * Set the text for this label.
     * @param text the new text.
     */
    setText(text){
        this._label.text = text;
    }
});
