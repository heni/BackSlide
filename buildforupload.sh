#!/bin/bash
rm -rf backslide@codeisland.org.zip
cd backslide@codeisland.org/
glib-compile-schemas schemas/
zip -r ../backslide@codeisland.org.zip * -x '*.po'
