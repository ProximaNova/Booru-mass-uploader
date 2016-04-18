# Booru mass uploader
This userscript allows you to mass-upload images to imageboard sites running Gelbooru and Danbooru v1 & 2.

With the [public Mass Uploader](https://unblock.ibsearch.xxx/mass-upload/) gone, a need arose for replacement. While many tried to mindlessly replicate the PHP-requiring setup of the old one, I took another approach and simply integrated the uploader into the Booru page itself, eliminating the need to bypass CORS.

After installation, [the userscript](https://github.com/Seedmanc/Booru-mass-uploader/raw/gh-pages/booru.mass.uploader.user.js) adds a link to [the mass uploader page](https://github.com/Seedmanc/Booru-mass-uploader/raw/gh-pages/index.html) in the booru's menu:

![screenshot: booru menu](http://puu.sh/mvB9F/ea5668b606.png)

The link leads to a (supposedly) non-existant location on the booru &mdash; `/index.php?page=post&s=mass_upload` &mdash; and injects the uploader code there, effectively incorporating its abilities into the booru.

This removes the need to bother with manual cookie retrieval, upload URL management, and, of course, CORS limitation. Additionally it allows to use custom tags from your settings. I also fixed the irrelevant "Firefox version 3.6 to 38" requirement; all I had to do was add the polyfill for that one missing method.

![screenshot: index.html](http://puu.sh/nglS1/ac7e2c6345.png)

## Other improvements

* Current booru engine can be manually selected.
* Interface was somewhat optimized, removing redundant `Set tags based on image file names alone` option. Just leave the additional tags field empty.  
* Last component of the filename (near the extension) is now ignored when parsing the filename for tags. Original filename can be put there to avoid filename collisions for pictures with identical sets of tags in one folder.
* The `Set Title of each image to its original filename` option puts said filename component into the title field when uploading.
* Users can set a custom Source field (which previously was hard-coded into PHP to advertise the uploader).
* Verbose error reporting in the log. Recognizes the following errors:
  * `image already exists`, linking to the existing duplicate on the booru
  * `image was deleted`, when a duplicate of the image was uploaded before, but later removed (Gelbooru only)
  * `image is too big, too small, or corrupted`, when the booru refuses to accept the image for other reasons (Gelbooru only)
* Users can upload folders (Chrome only)

If you see a booru that is not yet included in the header, you can put it there yourself following the pattern of the existing `@include` lines.

## See also

Be sure to check out these Booru-related userscripts:

* The [Booru Augmentation Project](https://github.com/Seedmanc/Booru-Augmentation-Project)
* Usernam's [Booru mass editor](https://github.com/ProximaNova/Booru-mass-editor)

## To do

Add URL decode checkbox from source tags. E.g., for the source "http://example.com/eg/123" "source%3Aexample.com%2Feg%2F123" as a tag in the filename would translate to the tag "source:http://example.com/eg/123".
