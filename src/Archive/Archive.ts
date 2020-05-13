import { Uri, FileType, workspace, window, Progress, CancellationToken, DebugConsoleMode } from "vscode";
import { Thread } from "../ProgressManager";
import { FileNodeSystem } from '../FileSystem/FileSystem';
import { Archive } from './ArchiveTypes/ArchiveType';
import * as path from 'path';

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