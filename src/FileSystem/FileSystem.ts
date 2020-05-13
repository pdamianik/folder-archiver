import { Uri, workspace, FileSystemError, FileType } from 'vscode';
import * as path from 'path';
import { Node, DirectoryNode, FileNode } from './Nodes';

export class FileNodeSystem {
    public files: DirectoryNode;
    private _elementCount : number;

    private constructor(loctation : Uri) {
        this.files = new DirectoryNode(loctation, path.basename(loctation.path));
        this._elementCount = 1;
    }

    public async queryFolder(folderPath : string) : Promise<DirectoryNode> {
        let currentFolder : DirectoryNode = this.files;

        folderPath = path.normalize(folderPath);
        let pathSegments = folderPath.split(path.sep);

        for (let folderIndex in pathSegments) {
            let folder = pathSegments[folderIndex];
            if (folderIndex === '0' && folder == currentFolder.name)
                continue;
            let node : Node;

            try {
                node = await currentFolder.getContentNode(folder);
            } catch (error) {
                if (error instanceof FileSystemError && error.message.startsWith('can\t'))
                    throw new FileSystemError('can\'t find path: ' + folderPath);
                throw error;
            }

            if (node instanceof DirectoryNode)
                currentFolder = node;
        }

        return currentFolder;
    }

    public async addDirectory(directoryPath : string, directoryUri : Uri) : Promise<void> {
        let queryPath = path.dirname(path.normalize(directoryPath)).replace('\\', '/');
        if (directoryPath === '.')
            return;
        (await this.queryFolder(queryPath)).contentNodes.push(new DirectoryNode(directoryUri, directoryPath));
        this._elementCount++;
    }

    public async addFile(filePath : string, fileUri : Uri) : Promise<void> {
        let directoryPath = path.dirname(path.normalize(filePath)).replace('\\', '/');
        let directoryNode : DirectoryNode = (await this.queryFolder(directoryPath));
        let newFileNode : FileNode = new FileNode(fileUri, filePath);
        directoryNode.contentNodes.push(newFileNode);
        this._elementCount++;
    }

    public async removePath(filePath : string) : Promise<void> {
        let normalizedPath = path.normalize(filePath);
        let folderPath = path.dirname(normalizedPath);
        let filename = path.basename(normalizedPath);
        let contentNodes = (await this.queryFolder(folderPath)).contentNodes;

        for (let i in contentNodes)
            if (filename === contentNodes[i].name)
                delete contentNodes[i];
    }

    public* getAllEntries() {
        let nodesToScan : (DirectoryNode|FileNode)[] = [this.files];

        while (nodesToScan.length != 0) {
            let nextNode = nodesToScan.shift()!;
            yield nextNode;
            if (nextNode instanceof DirectoryNode)
                nodesToScan.unshift(...nextNode.contentNodes);
        }

        return;
    }

    get elementCount() : number {
        return this._elementCount;
    }

    public static async scanPath(location : Uri) : Promise<FileNodeSystem> {
        if (!this.isFolder(location))
            throw new FileSystemError('path is not folder: ' + location);

        let pathsToScan : Uri[] = [location];
        let rootFolder : string = path.basename(location.path);
        let fileSystem : FileNodeSystem = new FileNodeSystem(location);

        while (pathsToScan.length != 0) {
            let pathToScan : any = pathsToScan.shift();
            let pathToScanRelative = pathToScan.path.substring(location.path.length+1);
            let relativePath = pathToScanRelative + (pathToScanRelative === "" ? "" : "/");
            let directoryContent;
            try {
                directoryContent = await workspace.fs.readDirectory(pathToScan);
            } catch (FileSystemError) {
                continue;
            }

            for (let pathInFolder of directoryContent) {
                let absoluteLocation = Uri.joinPath(pathToScan, pathInFolder[0]);
                let relativePathInFolder = relativePath + pathInFolder[0];

                if (pathInFolder[1] == FileType.File) {
                    await fileSystem.addFile(rootFolder + '/' + relativePathInFolder, absoluteLocation);
                } else if (pathInFolder[1] == FileType.Directory) {
                    pathsToScan.push(absoluteLocation);
                    await fileSystem.addDirectory(rootFolder + '/' + relativePathInFolder, absoluteLocation);
                }
            }
        }

        return fileSystem;
    }

    static async isFolder(location : Uri) : Promise<boolean> {
        return (await workspace.fs.stat(location)).type == 2;
    }
}