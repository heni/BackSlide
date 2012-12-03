const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Pref = Me.imports.settings;

/**
 * A simple interface for a timer which will call the given callback-function in
 *  intervals specified by the "delay"-setting.
 * <b>Documentation</b>
 * The JS standard functions "setTimeout()" and "setInterval()" don't seem to work, so
 *  we need to use the Mainloop-module. Documentation is hard to come by, here are some
 *  hints:
 * <ul>
 *     <li>
 *         Starting a new Timer/Interval:
 *         http://developer.gnome.org/glib/2.30/glib-The-Main-Event-Loop.html#g-timeout-add-seconds
 *     </li>
 *     <li>
 *         Cancelling a Timer/Interval:
 *         http://developer.gnome.org/glib/2.30/glib-The-Main-Event-Loop.html#g-source-remove
 *     </li>
 *     <li>
 *         Test-case from the Gjs Source, shows some of the syntax.
 *         http://git.gnome.org/browse/gjs/tree/test/js/testMainloop.js
 *     </li>
 * </ul>
 * @type {Lang.Class}
 */
const Timer = new Lang.Class({
    Name: "Timer",

    _settings: {},
    _delay: 20,
    _interval_id: null,
    _callback: null,

    _start_timestamp: {},
    _elapsed_minutes: 0,

    /**
     * Create a new timer (doesn't start it). To be usefull, you also need to specify a
     *  callback-function.
     * @see #setCallback
     * @private
     */
    _init: function(){
        this._settings = new Pref.Settings();
        this._delay = this._settings.getDelay();
        this._elapsed_minutes = this._settings.getElapsedTime();
        // Listen to changes and restart with new delay.
        this._settings.bindKey(Pref.KEY_DELAY, Lang.bind(this, function(value){
            this._delay = value.get_int32();
            this.restart();
        }));
    },

    /**
     * Set the callback-function for an exceeded delay.
     * @param callback the function to call when the delay has exceeded.
     */
    setCallback: function(callback){
        if (callback === undefined || callback === null || typeof callback !== "function"){
            throw TypeError("'callback' needs to be a function.");
        }
        this._callback = callback;
    },

    /**
     * Start or restart a new timer. The delay is taken from the settings. Calling this method
     *  will cause the current timer to be stopped, so repeated calls to this method don't have
     *  any effect. If no callback-function was set, this function will return without doing
     *  anything.
     * @see #setCallback
     */
    begin: function(){
        this.stop();
        this._start_timestamp = new Date();
        if (this._elapsed_minutes >= this._delay){
            /*
                Just defensive programming, the value could be manipulated
                See issue #12
            */
            this._elapsed_minutes = 0;
        }
        this._interval_id = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT, (this._delay-this._elapsed_minutes)*60000, Lang.bind(this, this._callbackInternal)
        );
    },

    /**
     * Stop the current timer. Repeated calls to this method don't have any effect.
     */
    stop: function(){
        if (this._interval_id !== null){
            if (GLib.source_remove(this._interval_id) ){
                this._interval_id = null;
                // Calculate elapsed time:
                let already = this._elapsed_minutes;
                let diff = Math.abs(new Date() - this._start_timestamp);
                this._elapsed_minutes = Math.floor((diff / 1000) / 60) + already;
                this._settings.setElapsedTime(this._elapsed_minutes);
            }
        }
    },

    /**
     * A convenient way to restart the timer.
     */
    restart: function(){
        this._start_timestamp = new Date();
        this._elapsed_minutes = 0; // Reset the elapsed minutes.
        this.stop();
        this.begin();
    },

    /**
     * The internal callback-function.
     * @private
     */
    _callbackInternal: function(){
        this._callback();
        this._start_timestamp = new Date(); // Reset the time-stamp, see issue12
        if (this._elapsed_minutes > 0){
            // The interval was started with a shortened delay. Restart it with the actual delay:
            this._elapsed_minutes = 0;
            this.begin();
            return false; // Don't restart the (shortened) interval.
        } else {
            // Was started with the un-shortened delay, continue looping.
            this._elapsed_minutes = 0;
            return true; // Keep on looping.
        }
    }
});