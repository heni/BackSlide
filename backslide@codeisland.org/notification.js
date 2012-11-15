const Lang = imports.lang;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;
const Main = imports.ui.main;

/**
 * A simple to use class for showing notifications.
 * @type {Lang.Class}
 */
const Notification = new Lang.Class({
    Name: "Notification",

    _source: {},

    _init: function(){
        this._source = new SimpleSource("BackSlide", "dialog-error");
        Main.messageTray.add(this._source);
    },

    /**
     * Issue a simple notification.
     * @param title the notification-title
     * @param banner_text the text for the banner
     * @param body the body-text (larger).
     */
    notify: function(title, banner_text, body){
        let notification = new MessageTray.Notification(this._source, title, banner_text,
            {
                body: body,
                bodyMarkup: true
            }
        );
        this._source.notify(notification);
    }
});

/**
 * A simple source-implementation for notifying new Notifications.
 * @type {Lang.Class}
 */
const SimpleSource = new Lang.Class({
    Name: "SimpleSource",
    Extends: MessageTray.Source,

    /**
     * Create a new simple source for notifications.
     * @param title the title
     * @param icon_name the image to show with the notifications.
     * @private
     */
    _init: function(title, icon_name){
        this.parent(title, icon_name);
        this._icon_name = icon_name;
    },

    createNotificationIcon: function() {
        let iconBox = new St.Icon({
            icon_name: this._icon_name,
            icon_type: St.IconType.FULLCOLOR,
            icon_size: 48
        });
        return iconBox;
    }
});