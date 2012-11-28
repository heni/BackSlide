## BackSlide

A simple Gnome-Shell Extension for an automatic background-image (wallpaper) slideshow.

### Screenshots

The Widget:

![Widget Screenshot](https://bitbucket.org/LukasKnuth/backslide/raw/3801467afe4c11dc0aaf31c126b3f740feef30de/_data/widget_screenshot.png)

The preferences page to manage the image list.

![Preferences Screenshot](https://bitbucket.org/LukasKnuth/backslide/raw/3801467afe4c11dc0aaf31c126b3f740feef30de/_data/list_screenshot.png)

(Wallpapers **not** included)

### Installation

The extension should be installed from the official extension repository. It can be found here: [![Install](http://media.cdn.ubuntu-de.org/wiki/attachments/56/32/Kippschalter-ON.png)](https://extensions.gnome.org/extension/543/backslide/)

#### Manual installation

If you need to "install" the extension manually, you'll need the following utilities:

* `git`
* `glib-compile-schemas`
* `gnome-tweak-tool` (Optional)

The packages which include the above tools may vary across different Linux distributions. Check your distributions wiki/package list to find the most suitable package for you. Afterwards, simply follow these steps:

    # Clone the repository (you might already did this!)
    git clone https://LukasKnuth@bitbucket.org/LukasKnuth/backslide.git BackSlide
    cd BackSlide
    # "Compile" the settings-schema:
    glib-compile-schemas backslide\@codeisland.org/schemas/
    # Copy the files over to the local extension directory:
    cp -r backslide\@codeisland.org/ ~/.local/share/gnome-shell/extensions/

Afterwards, you can activate the extension either by using the `gnome-tweak-tool` or at [extensions.gnome.org/local](https://extensions.gnome.org/local/)

### Settings

All settings can be changed from the `gnome-shell-extension-prefs`-tool or from the command line. Although you can set them using the `dconf`-tool, **using the frontend/widget is preferred!**.

* **Delay (in minutes) between wallpaper changes:** (*default*: `5`)

`dconf write /org/gnome/shell/extensions/backslide/delay 15`

* **Whether or not the wallpaper-list should be shuffled** (*default*: `true`)

`dconf write /org/gnome/shell/extensions/backslide/random true|false`

* **The List of wallpapers as a string-array of absolute, unix-styled path's:** (*default*: `[]`)

`dconf write /org/gnome/shell/extensions/backslide/image-list "['/path/to/picture.png', '/another/pic.png']"`

* **The already elapsed time (in minutes) from the last interval** (*default*: `0`)

`dconf write /org/gnome/shell/extensions/backslide/elapsed-time 0`

Settings changed, using the `dconf`-tool will **apply, after the extension is restarted**.