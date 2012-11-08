/**
  * This is where all the widgets for the menu life.
  */
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

const STOP_TIMER_STATE = "stop";
const START_TIMER_STATE = "start";
const LOOP_STATE = "loop";
const RANDOM_STATE = "random";
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

    /**
     * Creates a new control-widget.
     * @param isRandom whether the wallpaper-order is random or not.
     * @private
     */
    _init: function(isRandom){
        this.parent({
            reactive: false
        });
        // Add the layout:
        this.box = new St.BoxLayout({
            style_class: 'controls' // Check the stylesheet.css file!
        });
        this.addActor(this.box, {
            span: -1, // Take all the available space.
            align: St.Align.MIDDLE // See http://git.gnome.org/browse/gnome-shell/tree/js/ui/popupMenu.js#n150
        });
        // Add the buttons:
        let order_button = new StateControlButton(
            [
                {
                    name: LOOP_STATE,
                    icon: "media-playlist-repeat"
                },{
                    name: RANDOM_STATE,
                    icon: "media-playlist-shuffle"
                }
            ], Lang.bind(this, this._orderStateChanged)
        );
        order_button.setState((isRandom === true) ? RANDOM_STATE : LOOP_STATE);
        this.box.add_actor(order_button);
        this.box.add_actor(new StateControlButton(
            [
                {
                    name: STOP_TIMER_STATE,
                    icon: "media-playback-pause"
                },{
                    name: START_TIMER_STATE,
                    icon: "media-playback-start"
                }
            ], Lang.bind(this, this._timerStateChanged)
        ));
        this.box.add_actor(new ControlButton("media-skip-forward", Lang.bind(this, this._nextWallpaper)) );
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
    Extends: St.Button,

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

        this.parent({
            style_class: 'notification-icon-button control-button', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.set_style('padding: 8px'); // Put less space between buttons

        if (callback != undefined || callback != null){
            this.connect('clicked', callback);
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
    Extends: ControlButton,

    _state_index: 0,
    _states: [],
    _callback: null,

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
        for (var i in states){
            if (states[i].icon === undefined || states[i].name === undefined){
                throw TypeError("objects in the 'states'-array need an 'icon' and 'name'-property!");
            }
        }
        // Initialize:
        this._states = states;
        this._state_index = 0;
        this.parent(this._states[this._state_index].icon, null);

        if (callback !== undefined || callback !== null){
            this._callback = callback;
        }
        this.connect('clicked', Lang.bind(this, this._clicked));
    },

    /**
     * Called when the stateful button is clicked.
     * FOR INTERNAL USE ONLY!
     * @private
     */
    _clicked: function(){
        // Set new state:
        if (this._state_index+1 >= this._states.length){
            this._state_index = 0;
        } else {
            this._state_index++;
        }
        // change Icon.
        this.setIcon( this._states[this._state_index].icon );
        // Call-Back:
        if (this._callback !== null){
            this._callback( this._states[this._state_index] );
        }
    },

    /**
     * Set the state of this button. This will NOT trigger the callback function!
     * @param state the state-name of the button.
     */
    setState: function(state){
        for (var i in this._states){
            if (this._states[i].name === state){
                this._state_index = i;
                this.setIcon(this._states[i].icon);
            }
        }
    }

});

// -------------------------------------------------------------------------------

/**
 * Widget for setting the delay for the next Wallpaper-change.
 * @type {Lang.Class}
 */
const DelaySlider = new Lang.Class({
    Name: 'DelaySlider',
    Extends: PopupMenu.PopupSliderMenuItem,

    _MINUTES_MAX: 60,
    _MINUTES_MIN: 5,

    /**
     * Construct a new Widget.
     * @private
     */
    _init: function(minutes){
        this.parent(0); // value MUST be specified!
        this.setMinutes(minutes); // Set the real value.
    },

    /**
     * Set the value of the slider to x minutes.
     * @param minutes the value in minutes between _MINUTES_MAX and _MINUTES_MIN
     */
    setMinutes: function(minutes){
        // Validate:
        if (isNaN(minutes) || minutes < this._MINUTES_MIN || minutes > this._MINUTES_MAX){
            throw TypeError("'minutes' should be an integer between "
                +this._MINUTES_MIN+" and "+this._MINUTES_MAX+"");
        }
        // calculate and set value:
        let value = minutes / (this._MINUTES_MAX - this._MINUTES_MIN); // Value is set in percent, e.g 0.5 = 50%
        this.setValue(value.toFixed(2));
    },

    /**
     * Get the value in minutes from the slider.
     * @return int the value in minutes.
     */
    getMinutes: function(){
        // Get and calculate:
        let minutes = Math.floor(this._value * (this._MINUTES_MAX - this._MINUTES_MIN));
        return (minutes < this._MINUTES_MIN) ? this._MINUTES_MIN : minutes;
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
        this.addActor(this._label);
    },

    /**
     * Set the text for this label.
     * @param text the new text.
     */
    setText: function(text){
        if (this._label.clutter_text){
            this._label.text = text.toString();
        }
    }
});