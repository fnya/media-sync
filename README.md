# Media Sync

`Media Sync` is a plugin for [Obsidian](https://obsidian.md) that allows you to downloads images from the image URLs in Obsidian documents and displays the content.

## How to use

Click the `Media sync` icon in the left sidebar.

<img src="resources/image01.png" width="200">

Then, the plugin will start downloading images from the URLs in the documents.

Once an image file has been downloaded, the Markdown file will not be processed the next time.

The following image files with URLs starting with https.

<img src="resources/image02.png" width="480">

The image file is downloaded locally and the Markdown link is updated.

<img src="resources/image03.png" width="480">

A directory named `_media-sync_resouces` is created and the image files are downloaded into that directory.Directory paths can be changed in the configuration.

<img src="resources/image04.png" width="320">

Right-click on the file and click Media sync to download the image for the target note only.

When executed from the leaf icon, notes are cached and the image download process is skipped once the notes are executed, but right-click execution always downloads the images.

<img src="resources/image05.png" width="320">
