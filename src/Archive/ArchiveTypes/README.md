# Custom archive types tutorial

This README intends to teach you how to create your own archive types for this extension.

## Finished example

If you want to look at the finished code of the ZIP example build in this tutorial you can fined the finished project code in this git repo: https://github.com/pdamianik/zip-archive-type.git

## Steps

### Step 0: Initial setup

This tutorial will __not__ cover the basics of creating an extension. For more detail on how to create your own
extension please refer to the tutorial on the [Visual Studio Code Extension API homepage](https://code.visualstudio.com/api/get-started/your-first-extension).

This tutorial requires you to have a new vscode extension folder opened in vscode (or your prefered editor, which should be vscode if you try writing extensions for it :wink:). Furthermore no detailed explanation on the typescript language or the console commands will be covered in this tutorial, so we suggest you to have prior knowledge in these fields.

### Step 1: Dependencys

Add the new npm develop dependency `folder-archiver-types`, by execution the command:

```bash
npm install --save-dev folder-archiver-types
```

This npm package isn't necessary to develop a new archive type, but it provides interfaces like the ArchiveType` interface, which contains all the functions that are required to make a new ArchiveType and can save you from researching in this repos source code, to find out how these custom archive types actully work.

Also if you need any libarys to create your archive, you can install them here. In this example we are going to use the [JSZIP libary](https://stuk.github.io/jszip/) so we have to install it:

```bash
npm install jszip
```

### Step 1.5 (optional): Custom file

Create a new file for your custom archive type class. You can also just use the file `extension.ts`, which is created by default by the vscode-generator.

### Step 2: Importing the dependencys

Import the `ArchiveType` and the `ArchiveTypeLocales` interface from the freshly installed `folder-archive-types` by adding the following line to the file where you want to create your custom archive type class.

```typescript
import { ArchiveType, ArchiveTypeLocales } from 'folder-archiver-types';
```

Also if you want to use any extern libarys that you imported in Step 1 import them here:

```typescript
import * as jszip from 'jszip';
```

### Step 3: Creating the archive type class

Create a new class that implements the interface `ArchiveType`:

```typescript
export class ZipArchiveType implements ArchiveType {
    archive_extension_types: string[];
    archive_locales: ArchiveTypeLocales;
    newInstance(): ArchiveType {
        throw new Error("Method not implemented.");
    }
    addFolder(path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    addFile(path: string, fileData: Uint8Array): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getArchive(): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
}
```

> Don't worry if you get any errors if you implement the interface, we will fix those errors in the next step

### Step 4: Adding metainformation about our custom archive type

In this step we will set the metainformation about our custom archive type like the name or the file extension of the archive.

>    #### Substep 4.1: Setting the archive types file extension
>
>    To set the file extension of your archive type you simply have to create a string array in the attribute `archive_extension_types` in your custom archive type. For example in the case of a zip archive type this would be:
>
>    ```typescript
>    public archive_extension_types: string[] = ['zip'];
>    ```
>
>    #### Substep 4.2: Setting the archive types locales
>
>    There is also the attribute `archive_locales` which enables you to give your archive type e.g. a name. It requires you to set the attribute to a new object that contains following fields:
>
>    * name: the name of your custom archive type e.g. ZIP
>    * inProgressVerb: the verb that is used to describe that a file/folder is being archived by this archive type e.g. zipping
>    * fileTypeTitle: the name of a archive file resulting after the archiving process e.g. ZIP folder
>
>   ```typescript
>   public archive_locales: ArchiveTypeLocales = {
>       name:           'ZIP',
>       inProgressVerb: 'zipping',
>       fileTypeTitle:  'ZIP folder'
>   }
>   ```

After those substeps your custom archive type class should look something like this:

```typescript
export class ZipArchiveType implements ArchiveType {
    public archive_extension_types: string[] = ['zip'];
    public archive_locales: ArchiveTypeLocales = {
        name:           'ZIP',
        inProgressVerb: 'zipping',
        fileTypeTitle:  'ZIP folder'
    };

    newInstance(): ArchiveType {
        throw new Error("Method not implemented.");
    }

    addFolder(path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    addFile(path: string, fileData: Uint8Array): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getArchive(): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
}
```

### Step 5: Creating a constructor

The constructor can be used to initialse e.g. a libary that is needed to create the archive. Since this example uses the [JSZIP libary](https://stuk.github.io/jszip/) we are going to create a `JSZip` object that will store the zip folder in RAM.

```typscript
private zipFile: JSZip;

constructor() {
    this.zipFile = new JSZip();
}
```

### Step 6: Implement function `newInstance()`

Since the folder-archiver extension does save a object of the registered archive types to identify them, it has to create a new instance every time it wants to archive a new folder, so it calls this method. In most scenarios you will just create an new object of your class and return it in this method.

```typescript
newInstance(): ArchiveType {
    return new ZipArchiveType();
}
```

### Step 7: Implement functions to manipulate the archive

With the curent version of this extension there are two functions that will be called in the process of archiving to fill the archive with content files/folders. The examples for these functions will cover archiving the following tree:

 ```
 src
  | -- test
  |   | -- test.js
  | -- main.js
 ```

 * `addFolder(path: string) : Promise<void>`:

 This function will be called when the directory scanner encounters a directory.
 parameter | datatype | description | example
 --------- | -------- | ----------- | -------
 path | string | the path of the directory to add relative to and including the archives root directory | `src/`, `src/test/`

 In the ZIP archive example the code would be:

 ```typescript
 async addFolder(path: string): Promise<void> {
    this.zipFile.folder(path);
 }
 ```

 * `addFile(path: string, fileData: Uint8Array) : Promise<void>`:

 parameter | datatype | description | example
 --------- | -------- | ----------- | -------
 path | string | the path of the file to add relative to and including the archives root directory | `src/main.js`
 fileData | Uint8Array | the content of the file to add as an Uint8Array | No example

 In the ZIP archive example the code would be:

 ```typescript
 async addFile(path: string, fileData: Uint8Array): Promise<void> {
    this.zipFile.file(path, fileData);
 }
 ```

Both of these functions return a promise so they should be async functions.

### Step 8: Implement the `getArchive()` function to return the archive file

 In this step we implement the `getArchive()` function, which provides this extension a way to get the final archive and write it to a file. This function also returns a promise so it should be an async function.

In the ZIP archive example this code would look like this:

```typescript
async getArchive(): Promise<Uint8Array> {
    return this.zipFile.generateAsync({type: "uint8array"});
}
```
### Step 9: Add extension dependency

In your package.json you need to add a new entry `extensionDependencies`. This is a string array which contains the ids of all extension you require as a dependency for your extension. In our case we want to add a dependency for the extension `pdamianik.folder-archiver` to install this extension together with your custom archive type extension. This will enable us to use the API of the `folder-archiver` extension to register our custom archive type.

```json
"extensionDependencies": [
    "pdamianik.folder-archiver"
]
```

### Step 10: Register the new ArchiveType

To let this extension know that you developed a new ArchiveType you have to register your new ArchiveType. You can package and register multiple ArchiveTypes with one extension. To register the new archive type we have to get the `folder-archiver` extension or rather its exported API, on which we will call the `registerArchiveType()` extension which takes the id of our extension as the first parameter and an object of our new cutsom archive type as the second parameter. This function can be called with an virtually unlimited amount of parameters which enables us to register multiple new archive types at once, but in this ZIP example we are going to stick with just one new archive type. It's recommended to call this function in the activate() function of your extension but you can call it enywhere you want, because the folder archiver can live without it.

```typescript
let folderArchiverExtensionAPI = vscode.extensions.getExtension('pdamianik.folder-archiver');
folderArchiverExtensionAPI?.exports.registerArchiveType('pdamianik.zip-archive-type', new ZipArchiveType());
```

And with that you can test out your new archive type

### Step 11: Reregistering your archive type

The folder-archiver extension automatically unregisters the archive types of extensions that are disabled or uninstalled, but what it can't do is reregister your archive types when the folder-archiver extension gets uninstalled or diabled. So you should register a [onDidChange event listener](https://code.visualstudio.com/api/references/vscode-api#extensions) to check if the folder-archiver extension got uninstalld/disabled and installed/enabled again, in which case you should probalby reregister your custom archive types.