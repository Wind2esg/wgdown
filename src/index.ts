/**
 * wgdown ts
 * 
 * wgdown is a download tool using child process
 * 
 * @author wind2esg
 * @date 20190930
 * 
 * #parent
 * 
 * type def 
 * and parent
 */

import { existsSync, unlinkSync } from 'fs';
import { fork } from 'child_process';

interface Message{
    serverPath: string,
    localPath: string,
    size: number,
    result: string,
}
export interface Log{
    exist: number;
    noResource: number;
    download: number;
    error: number;
    child: number;
}

export interface Options {
    list: Array<DownloadTarget>;
    cpus: number;
    errorLimit: number;
    quiet: boolean;
    callback(log: Log, errorList: Array<string>): void;
}

interface ErrorCount{
    [index: string]: number;
}

export interface DownloadTarget{
    serverPath: string;
    localPath: string;
}

export class Wgdown {
    childPath: string;
    log: Log;
    errorList: Array<string>;

    constructor(
        public options: Options,
        childPath: string = './node_modules/wgdown/child'
    ){
        this.log = {} as Log;
        this.log.exist = 0;
        this.log.noResource= 0;
        this.log.download = 0;
        this.log.error = 0;
        this.log.child = 0;
        this.errorList = [];
        this.childPath = childPath;
    }

    parent() : void{
        if(this.options.list.length == 0){
            return;
        }

        if(this.options.quiet == undefined || this.options.quiet != false){
            this.options.quiet = true;
        }

        this.log.child++;
        let errorCount = {} as ErrorCount;
        let target: DownloadTarget = this.options.list[0];
        
        fork(this.childPath, [target.serverPath, target.localPath])
            .on('message', (message)=>{
                let msg: Message = JSON.parse(message);
                switch(msg.result){
                    case '0':
                        if(this.options.quiet){
                            console.log("downloaded:  " + msg.serverPath);
                        }
                        this.log.download++;
                        break;
                    case '1':
                        if(this.options.quiet){
                            console.log("exists on local:  " + msg.serverPath);
                        }
                        this.log.exist++;
                        break;
                    case '2':
                        if(this.options.quiet){
                            console.log("no resource on server:  " + msg.serverPath);
                        }
                        this.log.noResource++;
                        break;
                    case '5':
                        if(this.options.quiet){
                            console.log("error :  " + msg.serverPath);
                        }
                        errorCount[msg.serverPath] == undefined ? errorCount[msg.serverPath] = 1 : errorCount[msg.serverPath]++;
                        if(errorCount[msg.serverPath] < this.options.errorLimit){
                            this.options.list.push(msg);
                            if(existsSync(msg.localPath)){
                                unlinkSync(msg.localPath);
                            }
                        } else {
                            this.errorList.push(msg.serverPath);
                            this.log.error++;
                        }
                        break;
                    case '3':
                        if(this.options.quiet){
                            console.log("problem @:  " + msg.serverPath);
                        }
                        this.options.list.push(msg);
                        if(existsSync(msg.localPath)){
                            unlinkSync(msg.localPath);
                        }
                        break;
                    default:
                        if(this.options.quiet){
                            console.log("unknown child message");
                        }
                }
                this.parent();
            })
            .on('exit', ()=>{
                this.log.child--;
                if(this.log.child == 0){
                    this.options.callback(this.log, this.errorList);
                }
            });
        this.options.list.shift();    
    }

    download(): void{
        for (let i: number = 0; i < this.options.cpus; i++){
            this.parent();
        }
    }
}