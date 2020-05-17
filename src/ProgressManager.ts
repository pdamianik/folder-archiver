import * as vscode from "vscode";

export class ProgressManager{
    private activeTasks : Thread[];
    private waitingQueue: WaintingQueueObject[];
    private maxActiveThreadCount = () => vscode.workspace.getConfiguration('folder-archiver')['maxArchiveThreadCount'];
    
    public constructor() {
        this.activeTasks = [];
        this.waitingQueue = [];
    }

    public get axActiveThreadCount() {
        return this.maxActiveThreadCount();
    }

    public async spawnNewProcess(title : string, thread : Thread) : Promise<void> {
        thread = thread.newInstance();

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: title,
            cancellable: true
        }, async (progress, token) => {

            return new Promise<void>((res, rej) => {
                var activeTasks = this.activeTasks;
                var waitingQueue = this.waitingQueue;
                let maxActiveThreadCount = this.maxActiveThreadCount();

                function updateActiveTasks() {
                    activeTasks.splice(activeTasks.indexOf(thread), 1);
                    if (maxActiveThreadCount > 0 && activeTasks.length < maxActiveThreadCount() && waitingQueue.length !== 0) {
                        let newProcess = waitingQueue.shift();
                        activeTasks.push(newProcess?.runnable!);
                        newProcess?.runnable.run(newProcess.progress, newProcess.cancellationToken, newProcess.resolve, newProcess.reject);
                    }
                }

                function resolve(message?:string, value?: PromiseLike<any>) : void {
                    res(value);
                    vscode.window.showInformationMessage(message!);
                    updateActiveTasks();
                }
                
                async function reject(reason?: any) : Promise<void> {
                    vscode.window.showInformationMessage(reason);
                    updateActiveTasks();
                    return rej(reason);
                }

                if (token.isCancellationRequested) {
                    return;
                }

                token.onCancellationRequested(_=> {
                    thread.stop();
                    reject('task stopped by the user');
                });
                
                if (maxActiveThreadCount > 0 && this.activeTasks.length >= this.maxActiveThreadCount()) {
                    this.waitingQueue.push(new WaintingQueueObject(thread, progress, token, resolve, reject));
                    vscode.window.showWarningMessage('maximum thread count (' + maxActiveThreadCount() +  ') reached');
                } else {
                    this.activeTasks.push(thread);
                    thread.run(progress, token, resolve, reject);
                }
            });
        });
    }

    async killAllThreads() {
        for (let thread of this.activeTasks) {
            thread.stop();
        }

        this.activeTasks = [];

        for (let waitingThread of this.waitingQueue) {
            waitingThread.reject('Thread stopped by the ProgressManager');
        }

        this.waitingQueue = [];
    }
}

class WaintingQueueObject{
    runnable : Thread;
    progress : vscode.Progress<{message?:string, increment?:number}>;
    cancellationToken : vscode.CancellationToken;
    resolve : (message?: string, value?: PromiseLike<any>) => void;
    reject : (reason?: any) => void;

    constructor(runnable : Thread, progress : vscode.Progress<{message?:string, increment?:number}>, cancellationToken : vscode.CancellationToken, resolve : (message?: string, value?: PromiseLike<any>) => void, reject : (reason?: any) => void) {
        this.runnable = runnable;
        this.progress = progress;
        this.cancellationToken = cancellationToken;
        this.resolve = resolve;
        this.reject = reject;
    }
}

export interface Thread{
    run(progress : vscode.Progress<{message?:string, increment?:0}>, token : vscode.CancellationToken, resolve : (message?: string, value?: PromiseLike<any>) => void, reject : (reason?: any) => void) : Promise<void>;

    stop() : void;

    newInstance() : Thread;

    running : boolean;
}