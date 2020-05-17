// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { Archiver, ArchiveTypeManager, UserInterface } from './Archive/Archive';
import { ProgressManager } from './ProgressManager';
import { ArchiveType } from 'folder-archiver-types';

var progressManager : ProgressManager = new ProgressManager();

export async function activate(context: vscode.ExtensionContext) {
	var archiveTypeManager : ArchiveTypeManager = new ArchiveTypeManager();
	var activeExtensionIdsArray : string[] = [];

	for (let extension of vscode.extensions.all) {
		activeExtensionIdsArray.push(extension.id);
	}
	
	vscode.extensions.onDidChange(() => {
		if (activeExtensionIdsArray.length > vscode.extensions.all.length) {
			for (let activeExtensionId of activeExtensionIdsArray) {
				let extension = vscode.extensions.getExtension(activeExtensionId);
				if (extension === undefined || !extension.isActive) {
					archiveTypeManager.unregisterArchiveTypes(activeExtensionId);
				}
			}
		}

		activeExtensionIdsArray = [];
	
		for (let extension of vscode.extensions.all) {
			activeExtensionIdsArray.push(extension.id);
		}
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('folder-archiver.archive', async (location) => {
			if (location === undefined) {
				vscode.window.showErrorMessage('Rightclick on the folder you want to archive and click \'Archive\'');
				return;
			}

			let archive: ArchiveType = (await UserInterface.getArchiveType(archiveTypeManager.archiveTypes))?.newInstance()!;

			if (archive === undefined){
				return;
			}

			let filters : {[name: string] : string[]} = {};
			filters[archive.archive_locales.fileTypeTitle!] = archive.archive_extension_types;
			
			let archiver = new Archiver(location, archive, (data : Uint8Array) => {
				vscode.window.showSaveDialog({
					defaultUri:
						vscode.Uri.file(
							location.path + '.' + archive.archive_extension_types[0]
						),
					filters: filters
				}).then((uri : vscode.Uri | undefined) => {
					if (uri === undefined) {
						vscode.window.showWarningMessage('aborted saving ' + archive.archive_locales.fileTypeTitle);
					} else {
						workspace.fs.writeFile(uri!, data);
					}
				});
			});

			progressManager.spawnNewProcess(archive.archive_locales.inProgressVerb!, archiver);
		})
	);

	return {
		get archiveTypes() : {[archiveTypeName:string]: ArchiveType[];} {
			return archiveTypeManager.archiveTypes;
		},

		registerArchiveType(extensionId: string, ...archiveTypesToRegister : ArchiveType[]) : void {
			archiveTypeManager.registerArchiveType(extensionId, ...archiveTypesToRegister);
		},

		unregisterArchiveType(extensionId: string, ...archiveTypesToUnregister : ArchiveType[]) : void {
			archiveTypeManager.unregisterArchiveType(extensionId, ...archiveTypesToUnregister);
		}
	};
}

// this method is called when your extension is deactivated
export function deactivate() {
	progressManager.killAllThreads();
}
