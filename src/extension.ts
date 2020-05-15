// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { Archiver } from './Archive/Archive';
import { ZipArchive } from './Archive/ArchiveTypes/ZipArchive';
import { ProgressManager } from './ProgressManager';
import * as path from 'path';
import { ArchiveTypeManager, ArchiveType } from './Archive/ArchiveTypes/ArchiveType';

var progressManager : ProgressManager = new ProgressManager();

export namespace folderArchiver.util{
	export async function sleep(ms: number) {
		return new Promise(resolve=> setTimeout(resolve, ms));
	}

	export const DEBUG = false;

	export function log(message : any, ...optionalParameters : any[]) : void {
		if (DEBUG) {
			console.log(message, ...optionalParameters);
		}
	}
}

export async function activate(context: vscode.ExtensionContext) {
	var archiveTypeManager : ArchiveTypeManager = new ArchiveTypeManager();

	context.subscriptions.push(
		vscode.commands.registerCommand('folder-archiver.archive', async (location) => {
			if (location === undefined) {
				vscode.window.showErrorMessage('You need to select a folder to archive');
				return;
			}

			let metadata = await workspace.fs.stat(location);

			let archive: ArchiveType = (await archiveTypeManager.getArchiveType())?.newInstance()!;

			if (archive === undefined){
				return;
			}

			let filters : {[name: string] : string[]} = {};
			filters[archive.archive_locales.fileTypeTitle!] = archive.archive_extension_types;			
			let archiver = new Archiver(location, archive, (data : Uint8Array) => {
				vscode.window.showSaveDialog({
					defaultUri:
						vscode.Uri.file(
							location.path.substring(
								0,
								location.path.length-path.extname(location.path).length+1
							) + '.' + archive.archive_extension_types[0]
						),
					filters: filters
				}).then((uri : vscode.Uri | undefined) => {
					if (uri === undefined) {
						vscode.window.showWarningMessage('aborted saving archive');
					} else {
						workspace.fs.writeFile(uri!, data);
					}
				});
			});

			progressManager.spawnNewProcess(archive.archive_locales.inProgressVerb!, archiver);
		})
	);

	archiveTypeManager.registerArchiveType(new ZipArchive());

	return archiveTypeManager;
}

// this method is called when your extension is deactivated
export function deactivate() {
	progressManager.killAllThreads();
}
