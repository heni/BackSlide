const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();

/**
 * This class takes care of reading/writing the settings from/to the GSettings backend.
 * @type {Lang.Class}
 */
const Settings = new Lang.Class({
    Name: 'Settings',

    _schemaName: "org.gnome.shell.extensions.backslide",
    /**
     * The GSettings-object to read/write from/to.
     * @private
     */
    _setting: {},

    /**
     * Creates a new Settings-object to access the settings of this extension.
     * @private
     */
    _init: function(){
        let schemaDir = Me.dir.get_child('schemas').get_path();

        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(
            schemaDir, Gio.SettingsSchemaSource.get_default(), false
        );
        let schema = schemaSource.lookup(this._schemaName, false);

        this._setting = new Gio.Settings({
            settings_schema: schema
        });
    },

    /**
     * Get the delay (in minutes) between the wallpaper-changes.
     * @returns int the delay in minutes.
     */
    getDelay: function(){
        return this._setting.get_int("delay");
    },

    /**
     * Set the new delay in minutes.
     * @param delay the new delay (in minutes).
     * @throws TypeError if the given delay is not a number
     * @throws RangeError if the given delay is less than 1
     */
    setDelay: function(delay){
        // Validate:
        if (delay === undefined || delay === null || typeof delay !== "number"){
            throw TypeError("delay should be a number.");
        }
        if (delay <= 1){
            throw RangeError("delay can't be less then 1");
        }
        // Set:
        let key = "delay";
        if (this._setting.is_writable(key)){
            if (this._setting.set_int(key, delay)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    },

    /**
     * Whether the order of the image-list should be random.
     * @returns boolean true if random, false otherwise.
     */
    isRandom: function(){
        return this._setting.get_boolean("random");
    },

    /**
     * Specify, whether the order of the image-list should be random or not.
     * @param isRandom true if random, false otherwise.
     * @throws TypeError if "isRandom" is not a boolean value.
     */
    setRandom: function(isRandom){
        // validate:
        if (isRandom === undefined || isRandom === null || typeof isRandom !== "boolean"){
            throw TypeError("isRandom should be a boolean variable.");
        }
        // Set:
        let key = "random";
        if (this._setting.is_writable(key)){
            if (this._setting.set_boolean(key, isRandom)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    },

    /**
     * The list path's to the wallpaper-files.
     * @returns array list of wallpaper path's.
     */
    getImageList: function(){
        return this._setting.get_strv("image-list");
    },

    _errorWritable: function(key){
        return "The key '"+key+"' is not writable.";
    },
    _errorSet: function(key){
        return "Couldn't set the key '"+key+"'";
    }
});