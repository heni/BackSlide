/**
  * This is where the list of wallpapers is maintained and the current
  *  wallpaper is set.
  * This also includes jumping to next/previous wallpaper.
  * All Wallpaper-functionality is bundled in this class.
  */
const Lang = imports.lang;
const gio = imports.gi.Gio;

const Wallpaper = new Lang.Class({
    Name: "Wallpaper",

    _image_stack: [],

    /**
     * Constructs a new class to do all the wallpaper-related work.
     * @private
     */
    _init: function(){
        this._loadStack();
    },

    /**
     * Load the image-list from the settings, populate the Stack and
     *  randomize it, if necessary.
     * @private
     */
    _loadStack: function(){
        // TODO Reload the image-stack:
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
        let next_wallpaper = this._image_stack[this._image_stack.length-1]; // TODO This requires at least 2 images!
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
                gio.Settings.sync() // Necessary: http://stackoverflow.com/questions/9985140
                return true;
            } else {
                throw "Couldn't set the key!";
            }
        } else {
            throw "The key is not writable";
        }
    }
});