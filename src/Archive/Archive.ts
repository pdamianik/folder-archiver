import { Uri, FileType, workspace, window, Progress, CancellationToken, DebugConsoleMode } from "vscode";
import { Thread } from "../ProgressManager";
import { FileNodeSystem } from '../FileSystem/FileSystem';
import * as path from 'path';

export var archiveTypes : {[archiveTypeName:string]: Archive;} = {};

export async function getArchiveType() : Promise<Archive | undefined> {
    let archiveTypeNames : string[] = [];

    for (let archiveTypeName in archiveTypes) {
        archiveTypeNames.push(archiveTypeName);
    }

    let archiveTypeName : string;

    if (archiveTypeNames.length > 1) {
        archiveTypeName = (await window.showQuickPick(archiveTypeNames, {placeHolder: 'Select the archive type'}))!;
    } else if (archiveTypeNames.length === 1) {
        archiveTypeName = archiveTypeNames[0];
    } else {
        window.showErrorMessage('There are no archive types registered');
        return;
    }

    return archiveTypes[archiveTypeName];
}

export interface ArchiveLocales{
    /**
     * The name of the Archive Type
     * '.zip': 'ZIP'
     */
    name?:string;
    /**
     * The verb that will be shown to indicate that the extension currently archives a folder
     * '.zip': 'zipping'
     */
    inProgressVerb?:string;
    /**
     * The typle of the file type
     * '.zip': 'ZIP folder'
     */
    fileTypeTitle?:string;
}

export interface Archive{
    archive_extension_types: string[];
    archive_locales: ArchiveLocales;

    /**
     * Generates a new instance of this archive type
     */
    
    newInstance() : Archive;

    /**
     * Adds a folder to the archive
     * @param path The path of the folder relative to the archive's root
     */

    addFolder(path : string): Promise<void>;

    /**
     * Adds a file to the archive
     * @param path The path of the file relative to the archive's root
     * @param fileData The content of the file
     */

    addFile(path : string, fileData : Uint8Array) : Promise<void>;

    /**
     * Returns the archive in a form that is ready to be written to the disk
     */

    getArchive() : Promise<Uint8Array>;
}

export class Archiver implements Thread {
    private _running : boolean = false;
    private location : Uri;
    private archive : Archive;
    private onArchived : (data:Uint8Array) => void;

    constructor(location : Uri, archiveType : Archive, onArchived : (data:Uint8Array) => void) {
        this.location = location;
        this.archive = archiveType;
        this.onArchived = onArchived;
    }

    public newInstance() : Thread {
        return new Archiver(this.location, this.archive, this.onArchived);
    }

    public get running() {
        return this._running;
    }

    public async run(progress : Progress<{message?:string, increment?:number}>, token : CancellationToken, resolve : (message:string, value?: PromiseLike<any>) => void, reject : (reason?: any) => void) : Promise<void> {
        this._running = true;
        let rootFolder = path.basename(this.location.path);
        progress.report({ message : 'scanning folder ' + rootFolder });
        this.archive = this.archive.newInstance();

        let fileSystem : FileNodeSystem = await FileNodeSystem.scanPath(this.location);

        let entries = fileSystem.flat();
        let nextEntry = entries.next();
        let updateStep = 100/fileSystem.elementCount;

        while (this._running && !nextEntry.done) {
            let node = nextEntry.value;
            if (node.type === FileType.Directory) {
                this.archive.addFolder(node.fileSystemPath);
            } else if (node.type === FileType.File) {
                try {
                    await workspace.fs.readFile(node.uri).then(async (data) => {
                        await this.archive.addFile(node.fileSystemPath, data);
                    });
                } catch (FileSystemError) {
                }
            }
            nextEntry = entries.next();

            progress.report({
                message: node.fileSystemPath,
                increment: updateStep
            });
            
            // await folderArchiver.util.sleep(2500);
        }

        this.onArchived(await this.archive.getArchive());

        resolve('done ' + this.archive.archive_locales.inProgressVerb + ' folder ' +  path.basename(this.location.path));
        this._running = false;
    }

    public stop() {
        this._running = false;
    }
}