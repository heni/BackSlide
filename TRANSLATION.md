## BackSlide - Translation

### What Tools do I need?

We use [gettext](http://www.gnu.org/software/gettext/) for all translations. You'll need the following utilities:

* `msginit`
* `msgfmt`

These ship in different packages, depending on your distribution. Contact your distributions package manager or package-list online.

You'll also need the source-code of BackSlide. *Clone* **or** *Fork* the git repository (see README file, "Manual Installation"-section). If you are **not familiar with git**, you can also download the necessary files, create a translation and send in just the new file.

**See** ["How do I send in my translation?"](#how-do-i-send-in-my-translation)!

### How can I translate BackSlide?

Here is a workflow-example from within the cloned git-repository. For this example we'll assume, that your system language is `en`. The language-identifier for your system is the filename of the created `.po`-file, without the file-ending.

    # IF you're using Git:
    git checkout -b transEN dev #REPLACE en WITH YOUR LANGUAGE!

    # Navigate to the translation folder
    cd backslide\@codeisland.org/po/
    # This will create a new .po file in your systems language.
    msginit
    # Now edit the created file to add your translations.
    # Also, be sure to add your email address in the header.
    # When you're done:
    cd ..
    mkdir -p locale/en/LC_MESSAGES #REPLACE en WITH YOUR LANGUAGE!
    # "Compile" the language-file
    #   REPLACE en WITH YOUR LANGUAGE!
    msgfmt po/en.po -o locale/en/LC_MESSAGES/backslide.mo
    # Now, test everything:
    cd ..
    cp -rf backslide\@codeisland.org/ ~/.local/share/gnome-shell/extensions/

For more information on this topic, consult the [official translation document](https://live.gnome.org/GnomeShell/Extensions/FAQ/CreatingExtensions).

### How do I send in my translation?

**After** you finished with everything mentioned in [Why was my translation rejected?](#why-was-my-translation-rejected), it depends on what you prefer:

* [Create a new issue](https://bitbucket.org/LukasKnuth/backslide/issues/new) titled "Translation for [language]"
* Depending on how you got the source, do **one** of the following:
  * If you cloned the repository, [create a patch](http://git-scm.com/book/ch5-2.html#Public-Large-Project) and attach it to the issue
  * If you forked the repository, send a pull request from your `transXX`-branch
  * If you just downloaded the files, attach the translated `.po`-file to the issue
* Submit and wait for feedback. This might take a few days, so be patient.

### Why was my translation rejected?

We expect that a certain effort went into the making of a decent translation. So, **before** you send in your translation, make sure that you have at least checked that:

* you translated **all** strings.
* all your translations actually show up.
* no translated string destroys the layout by going "out-of-bounds"
* your translations are **correct**

As a side-note: Please **don't send us translations you created only with Google Translator** or the alike.