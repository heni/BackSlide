import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export const EXTENSION_UUID = 'backslide@codeisland.org';
export function Me() {
    let self = Me;
    if (self._me == null) {
        self._me = Extension.lookupByUUID(EXTENSION_UUID);
    }
    return self._me;
}
