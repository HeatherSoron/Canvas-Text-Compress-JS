To use this software, do one of two things:

(1) If you want to just play around with the compression algorithm, open up the included HTML file and enter some text into the left-hand box. Click the "save" button below, and notice that you've got a string of letters in the right-hand box. You can now copy that text, reload the page, paste the text back into the right-hand box, and hit load - returning your original text :). Alternatively, prepend the string 'data:image/png;base64,' to the output you get in the right-hand box, and you can use that in your browser's URL bar to view the data as a PNG.

(2) If you want to reuse the code, include everything inside the .js file. Use CANVAS_COMPESS.EncodeString and CANVAS_COMPRESS.DecodeImage, as per the following API:

CANVAS_COMPRESS.EncodeString(string input)
returns string output
input must end in a newline. This page appends one to make sure.
Compression is only achieved with large input data.

CANVAS_COMPRESS.DecodeImage(string input, function callback)
returns undefined, calls callback with argument string output



Also, note that Windows and Linux Chrome's canvas implementation is (as of Sep 22, 2011) somewhat buggy when you use ctx.fill - so set the image data directly, if you ever want to re-implement this code. Using ctx.fill resulting in corruption in the lower bits of pixels, which is VERY BAD as there's no error tolerance built into this algorithm.

This software is available under the CC0 license - basically, public domain. Feel free to treat it as such. It was coded by an anonymous author who prefers not to be named, working with Ethan Kaminski on the project Land of Seylia (a game that can be found on IndieDB). Contact Ethan at <ethan.kaminski@gmail.com> if you really need to, although we think that you'll be fine without doing so.
