# Grabs the last session-errors from the current X11 session.
# This includes full Stack-Trace of gnome-shell-extension errors.
# See https://live.gnome.org/GnomeShell/Extensions/StepByStepTutorial#lookingGlass
tail -n100 ~/.xsession-errors | less
