import { Archive, ArchiveLocales } from "./Archive";
import { TextEncoder } from "util";

export class TestArchive implements Archive{
    archive_extension_types: string[] = ["test"];
    archive_locales: ArchiveLocales = {
        name: 'Test',
        inProgressVerb: 'testing',
        fileTypeTitle: 'Test'
    };
    newInstance(): Archive {
        return new TestArchive();
    }
    async addFolder(path: string): Promise<void> {
    }
    async addFile(path: string, fileData: Uint8Array): Promise<void> {
    }
    async getArchive(): Promise<Uint8Array> {
        return new TextEncoder().encode("Test");
    }
}