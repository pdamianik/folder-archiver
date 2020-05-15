# Folder Archiver README

Provides a archiver with extendable archive types

## HOW TO

Just right-click on any folder in the workspace you want to archive and choose 'Archive'.
If you have more than one archive type installed, the extension will prompt you for an archive type it should use to archive the folder.
After the folder is scanned and archived a save dialog will pop up to choose where to save the archive.

## Features

* Custom archive types:

   You can create and register your own archive types

## Requirements

  Name |            Website            |         Install guide         
 ----- | ----------------------------- | ----------------------------- 
 JSZip | https://stuk.github.io/jszip/ | https://stuk.github.io/jszip/ 

## Extension Settings

This extension contributes the following settings:

* `folder-archiver.maxArchiveThreadCount`: configure how many archive threads can be active at the same time

## Known Issues

 - [ ] setting `folder-archiver.maxArchiveThreadCount` can't be disable with value of 0 or lower

## TODO

 - [ ] add extract functionality
 - [ ] add custom archive type tutrial

### Required for 1.0.0
 - [ ] namespaces
 - [ ] dependency injection

## Release Notes

### 0.0.1

Initial release of Folder Archiver