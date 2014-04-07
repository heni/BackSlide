## BackSlide - Development

All the development will take place on the `dev`-branch (except for [older versions](#extension-versions)). **Don't** install the extension from this branch **unless**:

 1. you're a developer
 2. you where told so
 3. you know what you're doing

The branch is not considered stable!

### Extension Versions

The `dev`-branch is for **development on the newest version of the extension only!**

The extension for older versions of GnomeShell get their own branch and all development for those versions (fixes, etc) will take place on *those* branches (you should still **create a topic-branch as described below!**). Also, those version-branches are considered stable.

* `gnome-3.8` the extension-version that supports GnomeShell 3.4 until 3.8 (stable)
* `master` supports GnomeShell 3.10 and newer (stable)
* `dev` development for GnomeShell 3.10 and newer (unstable)

### Development workflow

Here is the basic workflow for adding new features/fixing bugs:

 1. Create an issue and choose and appropriate kind
 2. Create a new topic-branch, based on the `dev`-branch (**or** the branch of an older version)
 3. Do the work on the topic branch and make sure everything works
 4. Send a pull-request from your topic-branch
 5. I'll test it myself and merge it into the `dev`-branch (**or** the branch of an older version)
 6. At some point, when I feel the new features/bug fixes can be published, the `dev`-branch will be merged into `master` and the extension will be send in for review

### Tagging

Every new version that is send for review (and accepted) will be tagged with a running version-number of the form `v1.x`.
