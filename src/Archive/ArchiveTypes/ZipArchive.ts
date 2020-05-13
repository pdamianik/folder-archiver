import { Archive, ArchiveLocales } from "../Archive";
import * as JSZip from 'jszip';

export class ZipArchive implements Archive {
    archive_extension_types : string[] = ["zip"];
    archive_locales:ArchiveLocales = {
        name: 'ZIP',
        inProgressVerb: 'zipping',
        fileTypeTitle: 'ZIP folder'
    }

    private zipFile : JSZip;

    constructor() {
        this.zipFile = JSZip();
    }

    newInstance(): Archive {
        return new ZipArchive();
    }

    async addFolder(path: string): Promise<void> {
        this.zipFile.folder(path);
    }

    async addFile(path: string, fileData: Uint8Array): Promise<void> {
        this.zipFile.file(path, fileData);
    }

    async getArchive(): Promise<Uint8Array> {
        return this.zipFile.generateAsync({type: "uint8array"});
    }
}