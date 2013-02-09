/**
 * Preferences for the extension which will be available in the "gnome-shell-extension-prefs"
 *  tool.
 * In the preferences, you can add new images to the list and remove old ones.
 * @see <a href="https://live.gnome.org/GnomeShell/Extensions#Extension_Preferences">Doc</a>
 */
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Pixbuf = imports.gi.GdkPixbuf;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Pref = Me.imports.settings;
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain('backslide');
const _ = Gettext.gettext;

let settings;
let list_selection;
let visible = false;
const IMAGE_REGEX = /^image\/\w+$/i;
/**
 * Called right after the file was loaded.
 */
function init(){
    Utils.initTranslations();
    settings = new Pref.Settings();
}

// TODO Keep numbering consistent (with row-changes).

function addFileEntry(model, path, number){
    // Load and scale the image from the given path:
    let image;
    try {
        image = Pixbuf.Pixbuf.new_from_file_at_scale(path, 200, 100, true);
    } catch (e){
        // Image could not be loaded. Invalid path.
        /*
            It's okay to do nothing here, when the list is stored, the invalid image will not be
            stored with the rest, so it's practically gone.
        */
    }
    if (image === undefined) return;
    // Append to the list:
    let iterator = model.append();
    model.set(iterator, [0,1,2], [number, image, path]);
}

function addDirectory(model, path, number){
    let dir = Gio.file_new_for_path(path);
    if (dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) != Gio.FileType.DIRECTORY){
        // Not a valid directory!
        return;
    }
    // List all children:
    let children = dir.enumerate_children("*", Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
    let info;
    while ( (info = children.next_file(null)) != null){
        if (info.get_file_type() == Gio.FileType.REGULAR && info.get_is_hidden() == false){
            // Check if it's an image:
            if (info.get_content_type().match(IMAGE_REGEX) != null){
                addFileEntry(model, path+"/"+info.get_name(), number);
            }
        } else if (info.get_file_type() == Gio.FileType.DIRECTORY && !info.get_is_hidden()){
            // Recursive search:
            addDirectory(model, path+"/"+info.get_name(), number);
        }
    }
}

/**
 * Called to build a preferences widget.
 * @return object any type of GTK+ widget to be placed inside the prefs window.
 */
function buildPrefsWidget(){
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });

    // The model for the tree:
    // See (and next page): http://scentric.net/tutorial/sec-treeviewcol-renderer.html
    let list_model = new Gtk.ListStore();
    list_model.set_column_types([GObject.TYPE_INT, Pixbuf.Pixbuf, GObject.TYPE_STRING]); // See http://blogs.gnome.org/danni/2012/03/29/gtk-liststores-and-clutter-listmodels-in-javascriptgjs/
    // The String-column is not visible and only used for storing the path to the pixbuf (no way of finding out later).

    // The tree itself:
    let image_tree = new Gtk.TreeView({
        expand: true,
        model: list_model
    });
    list_selection = image_tree.get_selection();
    // The number-column
    let number_col = new Gtk.TreeViewColumn({
        title: "#"
    });
    image_tree.append_column(number_col);
    let number_renderer = new Gtk.CellRendererText();
    number_col.pack_start(number_renderer, false);
    number_col.add_attribute(number_renderer, "text", 0);

    // The image-column:
    let image_col = new Gtk.TreeViewColumn({
        title: _("Wallpaper")
    });
    image_tree.append_column(image_col);
    let image_renderer = new Gtk.CellRendererPixbuf();
    image_col.pack_start(image_renderer, false);
    image_col.add_attribute(image_renderer, "pixbuf", 1);

    let tree_scroll = new Gtk.ScrolledWindow();
    tree_scroll.add(image_tree);
    frame.add(tree_scroll);

    // Fill the Model:
    let image_list = settings.getImageList();
    for (let i = 0; i < image_list.length; i++){
        addFileEntry(list_model, image_list[i], i+1);
    }
    // Pre-populate the list with default wallpapers:
    if (image_list.length <= 0){
        /*
            Just want to add, I have a bad feeling that this will not on every
            distribution be the directory where the "gnome-backgrounds"-package
            stores it's images...
            Anyways, if it's not, the search will gracefully die in peace.
         */
        addDirectory(list_model, "/usr/share/backgrounds/gnome/", 0);
    }

    // Toolbar to the right:
    let toolbar = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL
    });
    frame.add(toolbar);

    // Move the selected wallpaper up in the list.
    let move_up_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'go-up'
        })
    });
    move_up_button.connect('clicked', function(){
        let [ isSelected, model, iterator_current ] = list_selection.get_selected();
        if (isSelected){
            let iterator_up = iterator_current.copy();
            list_model.iter_previous(iterator_current);
            list_model.swap(iterator_current, iterator_up);
            // Manually fire the "row-changed"-event so "button_state_callback" gets triggered!
            list_model.row_changed(list_model.get_path(iterator_current), iterator_current);
        }
    });
    toolbar.add(move_up_button);

    // Move the selected wallpaper down in the list.
    let move_down_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'go-down'
        }),
        margin_bottom: 4
    });
    move_down_button.connect('clicked', function(){
        let [ isSelected, model, iterator_current ] = list_selection.get_selected();
        if (isSelected){
            let iterator_down = iterator_current.copy();
            list_model.iter_next(iterator_current);
            list_model.swap(iterator_current, iterator_down);
            // Manually fire the "row-changed"-event so "button_state_callback" gets triggered!
            list_model.row_changed(list_model.get_path(iterator_current), iterator_current);
        }
    });
    toolbar.add(move_down_button);

    // Add a Wallpaper to the list.
    let add_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'list-add'
        })
    });
    add_button.connect('clicked', function(){
        var filter = new Gtk.FileFilter();
        filter.add_pixbuf_formats();
        let chooser = new Gtk.FileChooserDialog({
            title: _("Select the new wallpapers."),
            action: Gtk.FileChooserAction.OPEN,
            filter: filter,
            select_multiple: true
        });
        chooser.add_button(Gtk.STOCK_CANCEL, 0);
        chooser.add_button(Gtk.STOCK_OPEN, 1);
        chooser.set_default_response(1);
        if (chooser.run() === 1){
            let files = chooser.get_filenames();
            // Add the selected files:
            for (let i = 0; i < files.length; i++){
                // Gather information:
                let path = Gio.file_new_for_path(files[i]);
                let type = path.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
                // Check whether a directory or a file was chosen:
                if (type == Gio.FileType.REGULAR){
                    addFileEntry(list_model, files[i], i);
                } else if (type == Gio.FileType.DIRECTORY){
                    addDirectory(list_model, files[i], i);
                }
            }
        }
        chooser.destroy();
    });
    toolbar.add(add_button);

    // Remove a Wallpaper from the list:
    let remove_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'list-remove'
        })
    });
    remove_button.connect('clicked', function(){
        let [ isSelected, model, iterator ] = list_selection.get_selected();
        if (isSelected){
            list_model.remove(iterator);
        }
    });
    toolbar.add(remove_button);

    // Check if we can move up/down and deactivate buttons if not.
    let button_state_callback = function(){
        // Check if we have data:
        if (list_model.iter_n_children(null) <= 1){
            move_up_button.set_sensitive(false);
            move_down_button.set_sensitive(false);
            return;
        }
        // Otherwise, we have data:
        let [ isSelected, model, iterator ] = list_selection.get_selected();
        // Something needs to be selected:
        if (!isSelected) return;

        // We have a selection and data:
        if (list_model.iter_next(iterator.copy()) === false){
            // We're at the bottom:
            move_up_button.set_sensitive(true);
            move_down_button.set_sensitive(false);
        } else if (list_model.iter_previous(iterator.copy()) === false){
            // We're at the top:
            move_up_button.set_sensitive(false);
            move_down_button.set_sensitive(true);
        } else {
            // We're in the middle, can move up and down:
            move_up_button.set_sensitive(true);
            move_down_button.set_sensitive(true);
        }
    };
    list_selection.connect('changed', button_state_callback);
    list_model.connect('row-changed', button_state_callback);

    // Store the changes in the settings, when the window is closed or the settings change:
    // Workaround, see https://bugzilla.gnome.org/show_bug.cgi?id=687510
    frame.connect('screen_changed', function(widget){
        if (!visible){
            visible = true; // Set this to prevent storing the list on initialisation of the widget.
            return;
        }
        visible = false;
        // Save the list:
        let [ success, iterator ] = list_model.get_iter_first();
        let list = [];
        if (success){
            do {
                let img_path = list_model.get_value(iterator, 2);
                list.push(img_path);
            } while (list_model.iter_next(iterator));
        }
        settings.setImageList(list);
    });

    frame.show_all();
    return frame;
}