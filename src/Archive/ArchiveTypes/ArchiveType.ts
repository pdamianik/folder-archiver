import { window } from 'vscode';

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

export class ArchiveTypeManager {
    private _archiveTypes : {[archiveTypeName:string]: Archive;} = {};

    public get archiveTypes() : {[archiveTypeName:string]: Archive;} {
        return this._archiveTypes;
    }

    /**
     * @returns a Archive type selected by the user
     */

    async getArchiveType() : Promise<Archive | undefined> {
        let archiveTypeNames : string[] = [];
    
        for (let archiveTypeName in this._archiveTypes) {
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
    
        return this._archiveTypes[archiveTypeName];
    }

    
    /**
     * Used to register a new archive type
     * @param archiveTypesToRegister A class that implements the Archiver interface
     */

    async registerArchiveType(...archiveTypesToRegister : Archive[]) : Promise<void> {
        for (let archiveType of archiveTypesToRegister) {
            if (this._archiveTypes.hasOwnProperty(archiveType.archive_locales.name!)) {
                continue;
            }
            this._archiveTypes[archiveType.archive_locales.name!] = archiveType;
        }
    }

    /**
     * Used to unregister a archive type
     * @param archiverTypeToUnregisterName The name of the archive type to unregister
     */

    async unregisterArchiver(...archiverTypeToUnregisterName : string[]) : Promise<void> {
        for (let archiveTypeName of archiverTypeToUnregisterName) {
            if (!this._archiveTypes.hasOwnProperty(archiveTypeName)) {
                continue;
            }
            delete this.archiveTypes[archiveTypeName];
        }
    }
}