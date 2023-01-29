
// write a logging convenience function
function log(message, style, indent = 0, border = false) {
    if (style == 'error') {
        style = 'background: rgb(255, 50, 50); color: black; font-weight: bold';
    } else if (style == 'success') {
        style = 'background: rgb(170, 255, 170); color: black; font-weight: bold';
    } else if (style == 'info') {
        style = 'background: rgb(170, 170, 255); color: black; font-weight: bold';
    } else if (style == "important") { 
        style = 'background: rgb(255, 255, 170); color: black; font-weight: bold';
    } else {
        style = ''
    }
    if (border) {
        style += '; border: 4px solid green; padding: 20px 20px; ';
        indent = 0;
    }

    console.log('%c' + '\t'.repeat(indent) + message, style);
}

// switch key, value pairs in a dictionary
function invert_dict(dict) {
    // https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
    return Object.fromEntries(
        Object.entries(dict).map(([key, value]) => [value, key])
    );
}

//  convert camel cass to snake case
function camel_to_Snake_case(str) {
    return str.replace(/([A-Z])/g, '_$1').toUpperCase();
}