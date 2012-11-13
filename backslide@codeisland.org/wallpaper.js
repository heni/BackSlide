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
    _image_queue: [],
    _is_random: false,
    _preview_callback: null,
    // TODO Move _setWallpaper() to Settings-class and add new "getWallpaper()"-method for V
    // TODO When reloading the queue (on start, change to order-mode), check if first item does not match current wallpaper (compare GSettings) and pop if necessary!

    /**
     * Constructs a new class to do all the wallpaper-related work.
     * @private
     */
    _init: function(){
        this._settings = new Pref.Settings();
        // Catch changes happening in the config-tool and update the list
        this._settings.bindKey(Pref.KEY_IMAGE_LIST, Lang.bind(this, function(){
            this._loadQueue();
        }));
        this._is_random = this._settings.isRandom();
        // Load images:
        this._loadQueue();
    },

    /**
     * <p>Set the function to be called, when the next image changes (due to a
     *  call to next(), shuffle() or order() ).</p>
     * <p>Calling this method will also cause the callback-function to be called
     *  immediately!</p>
     * @param callback the function to be called when the switch is done.
     *  This function will be passed an argument with the path of the next
     *  wallpaper.
     */
    setPreviewCallback: function(callback){
        // Validate:
        if (callback === undefined || callback === null || typeof callback !== "function"){
            throw TypeError("'callback' should be a function!");
        }
        // Set the callback:
        this._preview_callback = callback;
        // Callback:
        let next_wallpaper = this._image_queue[0];
        this._preview_callback(next_wallpaper);
    },

    /**
     * Load the image-list from the settings, populate the Stack and
     *  randomize it, if necessary.
     * @private
     */
    _loadQueue: function(){
        let list = this._settings.getImageList();
        // Check if shuffle:
        if (this._is_random === true){
            this._fisherYates(list);
            // Check if last element in queue is same as first in list:
            if (this._image_queue[this._image_queue.length-1] === list[0]){
                // Move duplicate to the end of the new list:
                let duplicate = list.shift();
                list.push(duplicate);
            }
        }
        // Append to queue:
        for (let i in list){
            this._image_queue.push(list[i]);
        }
    },

    /**
     * Sorts the image-list for iterative access.
     */
    order: function(){
        this._is_random = false;
        this._image_queue.length = 0; // Clear the array, see http://stackoverflow.com/a/1234337/717341
        this._loadQueue();
        // TODO Check if first is same image as current and pop
        if (this._preview_callback !== null){
            let next_wallpaper = this._image_queue[0];
            this._preview_callback(next_wallpaper);
        }
    },

    /**
     * Shuffle the image-list for random access.
     */
    shuffle: function(){
        this._is_random = true;
        // Shuffle the current queue
        this._fisherYates(this._image_queue);
        // Callback:
        if (this._preview_callback !== null){
            let next_wallpaper = this._image_queue[0];
            this._preview_callback(next_wallpaper);
        }
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
     */
    next: function(){
        // Check if there where any items left in the stack:
        if (this._image_queue.length <= 2){
            this._loadQueue(); // Load new wallpapers
        }
        let wallpaper = this._image_queue.shift();
        // Set the wallpaper:
        this._setWallpaper(wallpaper);
        // Callback:
        if (this._preview_callback !== null){
            let next_wallpaper = this._image_queue[0];
            this._preview_callback(next_wallpaper);
        }
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