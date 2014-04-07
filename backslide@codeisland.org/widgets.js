/**
  * This is where all the widgets for the menu life.
  */
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const Shell = imports.gi.Shell;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Slider = imports.ui.slider;

const Gettext = imports.gettext.domain('backslide');
const _ = Gettext.gettext;
/**
 * A Button to open the "gnome-shell-extension-prefs"-tool to configure this extension.
 * @type {Lang.Class}
 */
const OpenPrefsWidget = new Lang.Class({
    Name: "OpenPrefsWidget",
    Extends: PopupMenu.PopupBaseMenuItem,

    /**
     * Creates a new Button to open the prefs of this extension.
     * @param menu the menu to be toggled when the button is pressed.
     * @private
     */
    _init: function(menu){
        this.parent();
        this._menu = menu;
        // The Label:
        this._label = new St.Label({
            text: _("Manage Wallpapers")
        });

        this.actor.add_child(this._label, {
            span: -1,
            align: St.Align.MIDDLE
        });

        // Connect:
        this.connect('activate', Lang.bind(this, this._onClick));
    },

    _onClick: function(){
        this.launchExtensionPrefs("backslide@codeisland.org");
        this._menu.toggle(); // Toggle the menu.
    },

    /**
     * <p>Launches the "gnome-shell-extension-prefs"-tool with the settings for the extension
     *  with the given uuid.</p>
     * <p>This function is copied over from "js/ui/shellDBus.js".</p>
     * @param uuid the uuid of the extension.
     * @see js/ui/shellDBus.js
     */
    launchExtensionPrefs: function(uuid) {
        let appSys = Shell.AppSystem.get_default();
        let app = appSys.lookup_app('gnome-shell-extension-prefs.desktop');
        app.launch(global.display.get_current_time_roundtrip(),
            ['extension:///' + uuid], -1, null);
    }
});

// -------------------------------------------------------------------------------

/**
 * Shows a preview of the next wallpaper to be set.
 * @type {Lang.Class}
 */
const NextWallpaperWidget = new Lang.Class({
    Name: "NextWallpaperWidget",
    Extends: PopupMenu.PopupBaseMenuItem,

    _overlay_idle_id: 0,

    _init: function(){
        this.parent({
            reactive: false
        });

        // Overall Box:
        this._box = new St.BoxLayout({
            vertical: true,
            height: 200
        });

        this.actor.add_child(this._box, {
            span: -1,
            align: St.Align.MIDDLE
        });

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
    },

    /**
     * Load the next image to be set as the wallpaper into the widget.
     * @param path the path to the image to preview.
     */
    setNextWallpaper: function(path){
        if (this._texture.set_from_file(path) === false){
            // Couldn't load the image!
            throw "Image at '"+path+"' couldn't be found. It will be removed from the list...";
        }
    },

    destroy: function() {
        Mainloop.source_remove(this._overlay_idle_id);
        this._wallpaper.destroy();
        this._wallpaper = null;

        // Call the base-implementation:
        PopupMenu.PopupBaseMenuItem.prototype.destroy.call(this);
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
const WallpaperControlWidget = new Lang.Class({
    Name: "WallpaperControlWidget",
    Extends: PopupMenu.PopupBaseMenuItem,

    _order_button: {},

    /**
     * Creates a new control-widget.
     * @private
     */
    _init: function(){
        this.parent({
            reactive: false
        });
        // Add the layout:
        this.box = new St.BoxLayout({
            style_class: 'controls', // Check the stylesheet.css file!
            style: 'padding-left: 47px;'
        });

        this.actor.add(this.box, {
          expand: true
        });

        // Add the buttons:
        this._order_button = new ControlToggleButton(
            "media-playlist-shuffle", Lang.bind(this, this._orderStateChanged)
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
            ], Lang.bind(this, this._timerStateChanged)
        );
        timer_button.setState(STOP_TIMER_STATE);
        this.box.add_actor(timer_button.actor);
        this.box.add_actor(new ControlButton("media-skip-forward", Lang.bind(this, this._nextWallpaper)).actor );
    },

    /**
     * Set the state of the order-button.
     * @param isRandom whether the wallpaper-order is random or not.
     */
    setOrderState: function(isRandom){
        this._order_button.setState(isRandom);
    },

    /**
     * Emits the "order-state-changed"-signal, to be caught upstream.
     * @param state the state of the wallpaper-order.
     * @private
     */
    _orderStateChanged: function(state){
        this.emit("order-state-changed", state);
    },

    /**
     * Emits the "next-wallpaper"-signal, to be caught upstream.
     * @private
     */
    _nextWallpaper: function(){
        this.emit("next-wallpaper"); // Custom signal
    },

    /**
     * Emits the "timer-state-changed"-signal, to be caught upstream.
     * @param state the state of the widget. See STOP_WIDGET_TIMER_STATE and START_WIDGET_TIMER_STATE
     * @private
     */
    _timerStateChanged: function(state){
        this.emit("timer-state-changed", state);
    }

});

/**
 * A simple button, styled to be used inside the "WallpaperControlWidget".
 * @type {Lang.Class}
 */
const ControlButton = new Lang.Class({
    Name: 'ControlButton',
    actor: {},

    /**
     * Creates a new button for use inside "WallpaperControlWidget"
     * @param icon the name of the icon, see http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html
     * @param callback the callback for the "click"-event.
     * @private
     */
    _init: function(icon, callback){
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

        if (callback != undefined || callback != null){
            this.actor.connect('clicked', callback);
        }
    },

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon: function(icon){
        this.icon.icon_name = icon+'-symbolic';
    }
});

/**
 * A "ControlButton" which also maintains multiple states with different icons.
 * For every state-change (click) the given callback-function will be called with
 *  a parameter, indicating the current (new) state.
 * @type {Lang.Class}
 */
const StateControlButton = new Lang.Class({
    Name: "StateControlButton",
    actor: {},

    _state_index: 0,
    _states: [],
    _callback: null,
    _locked: false,

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
    _init: function(states, callback){
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
    },

    /**
     * Called when the stateful button is clicked.
     * FOR INTERNAL USE ONLY!
     * @private
     */
    _clicked: function(){
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
    },

    /**
     * Set the state of this button. This will NOT trigger the callback function!
     * @param state the state-name of the button.
     */
    setState: function(state){
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
    },

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon: function(icon){
        this.icon.icon_name = icon+'-symbolic';
    }

});

/**
 * A "ControlButton" which can be active or inactive. To be used in "WallpaperControlWidget".
 * @type {Lang.Class}
 */
const ControlToggleButton = new Lang.Class({
    Name: 'ControlToggleButton',
    actor: {},

    _callback: {},

    /**
     * Create a new toggle button.
     * @param icon the icon to use for the button
     * @param callback the click-callback for the button. The functions first parameter will be
     *  the new state of the button.
     * @private
     */
    _init: function(icon, callback){
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
    },

    _onToggle: function(){
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
    },

    /**
     * Set the state of the button (without triggering the callback).
     * @param on whether the button is toggled on or not.
     */
    setState: function(on){
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
const SliderItem = new Lang.Class({
    Name: 'SliderItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(value) {
        this.parent();

        this._box = new St.Table({style_class: 'slider-item'});

        this._slider = new Slider.Slider(value);

        this._box.add(this._slider.actor, {row: 0, col: 2, x_expand: true});
        this.actor.add(this._box, {span: -1, expand: true});
    },

    setValue: function(value) {
        this._slider.setValue(value);
    },

    getValue: function() {
        return this._slider._getCurrentValue();
    },

    setIcon: function(icon) {
        this._icon.icon_name = icon + '-symbolic';
    },

    connect: function(signal, callback) {
        this._slider.connect(signal, callback);
    }
});


/**
 * Widget for setting the delay for the next Wallpaper-change.
 * @type {Lang.Class}
 */
const DelaySlider = new Lang.Class({
    Name: 'DelaySlider',
    Extends: SliderItem,

    _MINUTES_MAX: 59,
    _MINUTES_MIN: 5,
    _HOURS_MAX: 48,
    _HOURS_MIN: 1,

    /**
     * Construct a new Widget.
     * @private
     */
    _init: function(minutes){
        this.parent(0, ''); // value MUST be specified!
        this.setMinutes(minutes); // Set the real value.
    },

    /**
     * Set the value of the slider to x minutes.
     * @param minutes the value in minutes between _MINUTES_MAX and _MINUTES_MIN
     */
    setMinutes: function(minutes){
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
    },

    /**
     * Get the value in minutes from the slider.
     * @return int the value in minutes.
     */
    getMinutes: function(){
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
const LabelWidget = new Lang.Class({
    Name: "LabelWidget",
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(text){
        this.parent({
            reactive: false // Can't be focused/clicked.
        });

        this._label = new St.Label({
            text: text
        });

        this.actor.add_child(this._label);
    },

    /**
     * Set the text for this label.
     * @param text the new text.
     */
    setText: function(text){
        this._label.text = text;
    }
});
