/**
 * Preferences for the extension which will be available in the "gnome-shell-extension-prefs"
 *  tool.
 * In the preferences, you can add new images to the list and remove old ones.
 * @see <a href="https://live.gnome.org/GnomeShell/Extensions#Extension_Preferences">Doc</a>
 */
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Pixbuf = imports.gi.GdkPixbuf;

/**
 * Called right after the file was loaded.
 */
function init(){

}

function addListEntry(model, path, number){
    // Load and scale the image from the given path:
    let image = Pixbuf.Pixbuf.new_from_file_at_scale(path, 200, 100, true);
    // Append to the list:
    let iterator = model.append();
    model.set(iterator, [0,1], [number, image]);
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
    list_model.set_column_types([GObject.TYPE_INT, Pixbuf.Pixbuf]);
    // The tree itself:
    let image_tree = new Gtk.TreeView({
        expand: true,
        model: list_model
    });
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
        title: "Wallpaper"
    });
    image_tree.append_column(image_col);
    let image_renderer = new Gtk.CellRendererPixbuf();
    image_col.pack_start(image_renderer, false);
    image_col.add_attribute(image_renderer, "pixbuf", 1);

    let tree_scroll = new Gtk.ScrolledWindow();
    tree_scroll.add(image_tree);
    frame.add(tree_scroll);
    // Fill the Model:
    for (let i = 0; i < 10; i++){
        addListEntry(list_model, "/home/luke/Bilder/Wallpapers/wiese_und_rote_berge.jpg", i+1);
    }

    // Toolbar to the right:
    let toolbar = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL
    });
    frame.add(toolbar);

    let move_up_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'go-up'
        })
    });
    toolbar.add(move_up_button);
    let move_down_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'go-down'
        }),
        margin_bottom: 4
    });
    toolbar.add(move_down_button);

    let add_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'list-add'
        })
    });
    toolbar.add(add_button);
    let remove_button = new Gtk.Button({
        image: new Gtk.Image({
            icon_name: 'list-remove'
        })
    });
    toolbar.add(remove_button);

    frame.show_all();
    return frame;
}