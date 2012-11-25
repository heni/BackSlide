/**
 * This file contains static Helper-functions for the extension
 */

/**
 * Prefix the given class-name with something unique to this application, to prevent naming
 *  clashes with other extensions.
 * @param classname the desired class-name
 * @return {String} the desired class-name, prefixed with something unique to this extension.
 * @see <a href="https://bitbucket.org/LukasKnuth/backslide/issue/3">Bug Report</a>
 */
function prefixClassName(classname){
    if (classname === undefined || classname === null || typeof classname !== "string"
        || classname.length <= 0){
        throw new TypeError("'classname' should be a string with 1+ characters.");
    }
    // Prefix (can't use the UUID because @ is invalid class-name character...):
    return "BackSlide_" + classname;
}
