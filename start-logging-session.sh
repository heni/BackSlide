# This replaces the current gnome-shell with a new one and redirects all
# output to the /tmp/gnome.log file (the previous file is kept as .log.old)
# To read the file use the old session-error.sh file!
cp /tmp/gnome.log /tmp/gnome.log.old
gnome-shell -r &> /tmp/gnome.log &
