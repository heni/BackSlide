# This grabs the output of the current gnome-shell session, IF it has been
# started using the "start-loggin-session.sh"-script in this directory!
if [ -f /tmp/gnome.log ];
then
	tail -n100 /tmp/gnome.log | less '+>'
else
	echo "The log-file doesn't exist. Did you start the shell with the start-logging-session.sh script??"
fi
