const Lang = imports.lang;
const gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Pref = Me.imports.settings;

/**
 * This is where the list of wallpapers is maintained and the current
 *  wallpaper is set.
 * This also includes jumping to next/previous wallpaper.
 * All Wallpaper-functionality is bundled in this class.
 */
const Wallpaper = new Lang.Class({
    Name: "Wallpaper",

    _settings: {},
    _image_stack: [],
    // TODO Re-implement the stack as queue
    // TODO Append new "rounds" to the queue (in random mode, when no preview available because end).
    // TODO In next(), check if new item after next (for preview) is available, otherwise ^
    // TODO Reimplement random/loop as flags and do sort/shuffle in _loadStack()
    // TODO When mode changes, clear queue and reload ^
    // TODO When shuffling the queue, check if first item does not match current wallpaper (compare GSettings) and pop if nessesary!

    /**
     * Constructs a new class to do all the wallpaper-related work.
     * @private
     */
    _init: function(){
        this._settings = new Pref.Settings();
        this._loadStack();
        // Catch changes happening in the config-tool and update the list
        this._settings.bindKey(Pref.KEY_IMAGE_LIST, Lang.bind(this, function(){
            print("new wallpapers");
            this._loadStack();
        }));
    },

    /**
     * Load the image-list from the settings, populate the Stack and
     *  randomize it, if necessary.
     * @private
     */
    _loadStack: function(){
        this._image_stack = this._settings.getImageList();
    },

    /**
     * Sorts the image-list for itterative access.
     */
    order: function(){
        // TODO Callback because next image changed.
        this._loadStack(); // Simply reload for now.
    },

    /**
     * Shuffle the image-list for random access.
     */
    shuffle: function(){
        // TODO Callback because next image changed.
        this._loadStack();
        this._fisherYates(this._image_stack);
    },

    /**
     * Implementation of the "Fisher–Yates shuffle"-algorithm, taken from
     *  http://stackoverflow.com/q/2450954/717341
     * @param array the array to shuffle.
     * @return {Boolean} false if the arrays length is 0.
     * @private
     */
    _fisherYates: function(array) {
        var i = array.length, j, tempi, tempj;
        if ( i == 0 ) return false;
        while ( --i ) {
            j       = Math.floor( Math.random() * ( i + 1 ) );
            tempi   = array[i];
            tempj   = array[j];
            array[i] = tempj;
            array[j] = tempi;
        }
        return true;
    },

    /**
     * Slide to the next wallpaper in the list.
     * @param callback the function to be called when the switch is done.
     *  This function will be passed an argument with the path of the next
     *  wallpaper.
     */
    next: function(callback){
        if (callback === undefined || callback === null || typeof callback !== "function"){
            throw TypeError('A callback-function needs to be assigned!');
        }
        let wallpaper = this._image_stack.pop();
        // Check if there where any items left in the stack:
        if (wallpaper === undefined){
            this._loadStack();
            wallpaper = this._image_stack.pop();
        }
        // Set the wallpaper:
        this._setWallpaper(wallpaper);
        // Callback:
        let next_wallpaper = this._image_stack[this._image_stack.length-1]; // TODO This only works with 2 items in the stack!
        callback(next_wallpaper);
    },

    /**
     * Set the new Wallpaper (using dconf).
     * @param path an absolute, linux style path to the image-file for the new Wallpaper.
     *  For example: "/home/user/image.jpg"
     * @throws string if there was a problem setting the new wallpaper.
     * @throws TypeError if the given path was invalid
     * @returns boolean true on success (otherwise an exception is thrown).
     * @private
     */
    _setWallpaper: function(path){
        if (path === undefined || path === null)
            throw TypeError('path should be a valid, absoloute, linux styled path.');
        // Get the GSettings-object for the background-schema:
        let background = new gio.Settings({
            schema: "org.gnome.desktop.background"
        });

        if (background.is_writable("picture-uri")){
            // Set a new Background-Image (should show up immediately):
            if (background.set_string("picture-uri", "file://"+path) ){
                gio.Settings.sync(); // Necessary: http://stackoverflow.com/questions/9985140
                return true;
            } else {
                throw "Couldn't set the key!";
            }
        } else {
            throw "The key is not writable";
        }
    }
});