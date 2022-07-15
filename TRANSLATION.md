## BackSlide - Translation

### What Tools do I need?

We use [gettext](http://www.gnu.org/software/gettext/) for all translations. You'll need the following utilities:

* `msginit`
* `msgfmt`
* `msgmerge`
* `xgettext` (Optional, for updating the template)

These ship in different packages, depending on your distribution. Contact your distributions package manager or package-list online.

You'll also need the source-code of BackSlide. *Clone* **or** *Fork* the git repository (see README file, "Manual Installation"-section). If you are **not familiar with git**, you can also download the necessary files, create a translation and send in just the new file.

**See** ["How do I send in my translation?"](#how-do-i-send-in-my-translation)!

### How can I translate BackSlide?

Here is a workflow-example from within the cloned git-repository. For this example we'll assume, that your system language is `en`. The language-identifier for your system is the filename of the created `.po`-file, without the file-ending.

```bash
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
```

For more information on this topic, consult the [official translation document](https://live.gnome.org/GnomeShell/Extensions/FAQ/CreatingExtensions).

### How can I *update* a translation?

If a translation is outdated (some new strings aren't translated yet), an update can be made to get the new strings in the `.po`-file, without deleting the old translations:

```bash
# Navigate to the translation folder
cd backslide\@codeisland.org/po/
# Use the convenient script to updated the .po file
#   REPLACE en WITH YOUR LANGUAGE!
./update_translation.sh en.po
# Update the .po-file (add the new translations).
# When you're done, recompile the translation
cd ..
# REPLACE en WITH YOUR LANGUAGE!
msgfmt po/en.po -o locale/en/LC_MESSAGES/backslide.mo
```

Now **test everything** and send in the new `.po`-file as described in ["How do I send in my translation?"](#how-do-i-send-in-my-translation).

#### If you introduced new strings

The above process *only works*, if the `default.pot`-file is up-to-date (which I will normally take care of).

However, if for some reason you added new strings to any `.js`-file, which need translation, you have to update the `default.pot`-file first. To do so, use the script provided:

```bash
# Navigate to the translation folder
cd backslide\@codeisland.org/po/
# Use the convenient script to updated the default.pot file
./update_template.sh
```

**Be sure to check if everything is there first!** Afterwards, you can update the actual translations as shown in ["How can I *update* a translation?"](#how-can-i-update-a-translation)

### How can I *correct* a translation?

If you feel that something has not been translated very well or simply plain wrong, please [create a new issue](https://bitbucket.org/LukasKnuth/backslide/issues/new).

If you can, you can also include an updated translation string, a patch or even send in a pull-request (see above for details on these topics).

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