import { FileType, Uri, FileSystemError } from "vscode";
import * as path from 'path';

export interface Node {
    type: FileType;
    name: string;
    uri: Uri;
    fileSystemPath: string;
}

export class FileNode implements Node {
    type: FileType = FileType.File;
    name: string;
    uri: Uri;
    fileSystemPath: string;
    
    constructor(location : Uri, fileSystemPath: string) {
        this.uri = location;
        this.name = path.basename(location.path);
        this.fileSystemPath = fileSystemPath;
    }
}

export class DirectoryNode extends FileNode implements Node {
    type: FileType = FileType.Directory;
    private _contentNodes: (DirectoryNode | FileNode)[] = [];

    async getContentNode(name : string) : Promise<DirectoryNode | FileNode> {
        if (name === '.')
            return this;

        for (let contentNode of this._contentNodes)
            if (contentNode.name === name)
                if (contentNode.type != FileType.Directory)
                    throw new FileSystemError('node ' + name + ' is not a directory');
                else
                    return contentNode;
        throw new FileSystemError('can\'t find node: ' + name);
    }

    public get contentNodes() : (DirectoryNode | FileNode)[] {
        return this._contentNodes;
    }
}