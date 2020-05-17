import { Uri, FileType, workspace, Progress, CancellationToken, DebugConsoleMode } from "vscode";
import { Thread } from "../ProgressManager";
import { FileSystemModel } from '../FileSystemModel/FileSystemModel';
import { ArchiveType } from 'folder-archiver-types';
import * as path from 'path';
import { window, extensions } from 'vscode';

export class Archiver implements Thread {
    private _running : boolean = false;
    private location : Uri;
    private archive : ArchiveType;
    private onArchived : (data:Uint8Array) => void;

    constructor(location : Uri, archiveType : ArchiveType, onArchived : (data:Uint8Array) => void) {
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

        let fileSystem : FileSystemModel = await FileSystemModel.scanPath(this.location);

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

        if (!this._running) {
            reject('Thread stopped by the ProgressManager');
        }

        resolve('done ' + this.archive.archive_locales.inProgressVerb + ' folder ' +  path.basename(this.location.path));
        this._running = false;
    }

    public stop() {
        this._running = false;
    }
}

export class UserInterface {
    static async getArchiveType(archiveType : {[archiveTypeName:string]: ArchiveType[];}) : Promise<ArchiveType | undefined> {
        let archiveTypeNames : string[] = [];
    
        for (let archiveTypeName in archiveType) {
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
    
        return archiveType[archiveTypeName][0];
    }
}

export class ArchiveTypeManager {
    private _archiveTypes : {[archiveTypeName:string]: ArchiveType[];} = {};
    private _extensionIds : {[extensionId:string]: ArchiveType[];} = {};

    public get archiveTypes() : {[archiveTypeName:string]: ArchiveType[];} {
        return this._archiveTypes;
    }

    /**
     * Used to register a new archive type
     * @param extensionId The id of the extension that the archive types should be registered for
     * @param archiveTypesToRegister A class that implements the Archiver interface
     */

    public registerArchiveType(extensionId:string, ...archiveTypesToRegister: ArchiveType[]) : void {
        if (extensions.getExtension(extensionId) === undefined) {
            return;
        }

        if (!this._extensionIds.hasOwnProperty(extensionId)) {
            this._extensionIds[extensionId] = [];
        }

        for (let archiveType of archiveTypesToRegister) {
            if (this._extensionIds[extensionId].includes(archiveType)) {
                continue;
            }
            if (!this._archiveTypes.hasOwnProperty(archiveType.archive_locales.name)) {
                this._archiveTypes[archiveType.archive_locales.name] = [];
            }
            this._extensionIds[extensionId].push(archiveType);
            this._archiveTypes[archiveType.archive_locales.name].push(archiveType);
        }
    }

    /**
     * Used to unregister a archive type
     * @param extensionId The id of the extension that the archive types are registered for
     * @param archiverTypeToUnregisterName The name of the archive type to unregister
     */

    public unregisterArchiveType(extensionId: string, ...archiverTypesToUnregister : ArchiveType[]) : void {
        if (!this._extensionIds.hasOwnProperty(extensionId)) {
            return;
        }

        for (let archiveType of archiverTypesToUnregister) {
            if (this._extensionIds[extensionId].includes(archiveType)) {
                continue;
            }
            this._extensionIds[extensionId].splice(this._extensionIds[extensionId].indexOf(archiveType), 1);
            this._archiveTypes[archiveType.archive_locales.name].splice(this._archiveTypes[archiveType.archive_locales.name].indexOf(archiveType), 1);
        }
    }

    /**
     * Used to unregister all archive types related to a extension id
     * @param extensionId The id of the extension the archive types to unregister are registered for
     */

    public unregisterArchiveTypes(extensionId: string) {
        if (!this._extensionIds.hasOwnProperty(extensionId)) {
            return;
        }

        for (let archiveTypeIndex in this._extensionIds[extensionId]) {
            let archiveType: ArchiveType = this._extensionIds[extensionId][archiveTypeIndex];
            this._extensionIds[extensionId].splice(Number(archiveTypeIndex), 1);
            this._archiveTypes[archiveType.archive_locales.name].splice(this._archiveTypes[archiveType.archive_locales.name].indexOf(archiveType), 1);
        }
    }
}