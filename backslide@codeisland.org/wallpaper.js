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

    /**
     * Constructs a new class to do all the wallpaper-related work.
     * @private
     */
    _init: function(){
        // TODO Load the list of wallpapers and operate on the list!
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
                return true;
            } else {
                throw "Couldn't set the key!";
            }
        } else {
            throw "The key is not writable";
        }
    }
})