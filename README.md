# Archiver README

Provides a archiver with extendable archive types

## HOW TO

Just right-click on any folder in the workspace you want to archive and choose 'Archive'.
If you have more than one archive type installed, the extension will prompt you for an archive type it should use to archive the folder.
After the folder is scanned and archived a save dialog will pop up to choose where to save the archive.

## Features

* Custom archive types:

   You can create and register your own archive types. You can find a tutorial on how to create your own folder-archive ArchiveType here: https://github.com/pdamianik/folder-archiver/blob/master/src/Archive/ArchiveTypes/README.md

## Requirements

## Extension Settings

This extension contributes the following settings:

* `folder-archiver.maxArchiveThreadCount`: configure how many archive threads can be active at the same time

## Known Issues

 - [x] setting `folder-archiver.maxArchiveThreadCount` can't be disable with value of 0 or lower

## TODO

### Requried for the first release 0.0.1

 - [x] add custom archive type tutrial

### Required for 0.1.0

 - [ ] add extract functionality

### Requrired for 1.0.0

 - [ ] reimplement the system with dependency injection

## Release Notes

### 0.0.1

Initial release of Folder Archiver