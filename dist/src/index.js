"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
class Wgdown {
    constructor(options, childPath = './node_modules/wgdown/child') {
        this.options = options;
        this.log = {
            exist: 0,
            noResource: 0,
            download: 0,
            error: 0,
            child: 0
        };
        this.errorList = [];
        this.childPath = childPath;
    }
    parent() {
        if (this.options.list.length == 0) {
            return;
        }
        if (this.options.quiet == undefined || this.options.quiet != false) {
            this.options.quiet = true;
        }
        this.log.child++;
        let errorCount;
        let target = this.options.list[0];
        child_process_1.fork(this.childPath, [target.serverPath, target.localPath])
            .on('message', (message) => {
            let msg = JSON.parse(message);
            switch (msg.result) {
                case '0':
                    if (this.options.quiet) {
                        console.log("downloaded:  " + msg.serverPath);
                    }
                    this.log.download++;
                    break;
                case '1':
                    if (this.options.quiet) {
                        console.log("exists on local:  " + msg.serverPath);
                    }
                    this.log.exist++;
                    break;
                case '2':
                    if (this.options.quiet) {
                        console.log("no resource on server:  " + msg.serverPath);
                    }
                    this.log.noResource++;
                    break;
                case '5':
                    if (this.options.quiet) {
                        console.log("error :  " + msg.serverPath);
                    }
                    errorCount[msg.serverPath] == undefined ? errorCount[msg.serverPath] = 1 : errorCount[msg.serverPath]++;
                    if (errorCount[msg.serverPath] < this.options.errorLimit) {
                        this.options.list.push(msg);
                        if (fs_1.existsSync(msg.localPath)) {
                            fs_1.unlinkSync(msg.localPath);
                        }
                    }
                    else {
                        this.errorList.push(msg.serverPath);
                        this.log.error++;
                    }
                    break;
                case '3':
                    if (this.options.quiet) {
                        console.log("problem @:  " + msg.serverPath);
                    }
                    this.options.list.push(msg);
                    if (fs_1.existsSync(msg.localPath)) {
                        fs_1.unlinkSync(msg.localPath);
                    }
                    break;
                default:
                    if (this.options.quiet) {
                        console.log("unknown child message");
                    }
            }
            this.parent();
        })
            .on('exit', () => {
            this.log.child--;
            if (this.log.child == 0) {
                this.options.callback(this.log, this.errorList);
            }
        });
        this.options.list.shift();
    }
    download() {
        for (let i = 0; i < this.options.cpus; i++) {
            this.parent();
        }
    }
}
exports.Wgdown = Wgdown;
