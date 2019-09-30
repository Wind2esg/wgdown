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
 * #child
 */
import { fs } from 'fs';
import { childProcess } from 'child_process';
import { request } from 'request';
import { process } from 'process';

class Message {
    constructor(
        public serverPath: string,
        public localPath: string,
        public size: number,
        public result: string,
        argv2: string,
        argv3: string,
    ){
        serverPath = argv2;
        localPath = argv3;
    }

}

class Options {
    constructor(
        public list: 
    )
}

class Wgdown {

}

// parent
const wgdown = (options: any)=>{

    let parent = (options: any)=>{
        if (options.list.length == 0){
          return ;
        }
        
        if(options.quiet == undefined || options.quiet != false){
            options.quiet = true;
        }
        let errorCount = {};
    
        log.child++;
        let downloadTarget = options.list[0];
        childProcess.fork('./node_modules/wgdown', [downloadTarget.serverPath, downloadTarget.localPath])
                      .on('message', (message: any)=>{
                        let msg = JSON.parse(message);
                        switch(msg.result){
                            case '0':
                                if(options.quiet){
                                    console.log("downloaded:  " + msg.serverPath);
                                }
                                
                                log.download++;
                                break;
                            case '1':
                                if(options.quiet){
                                    console.log("exists on local:  " + msg.serverPath);
                                }
                                log.exist++;
                                break;
                            case '2':
                                if(options.quiet){
                                    console.log("no resource on server:  " + msg.serverPath);
                                }
                                log.noResource++;
                                break;
                            case '5':
                                if(options.quiet){
                                    console.log("error :  " + msg.serverPath);
                                }
                                errorCount[msg.serverPath] == undefined ? errorCount[msg.serverPath] = 1 : errorCount[msg.serverPath]++;
                                if(errorCount[msg.serverPath] < options.errorLimit){
                                    options.list.push(msg);
                                    if(fs.existsSync(msg.localPath)){
                                        fs.unlinkSync(msg.localPath);
                                    }
                                } else {
                                    errorList.push(msg.serverPath);
                                    log.error++;
                                }
                                break;
                            case '3':
                                if(options.quiet){
                                    console.log("problem @:  " + msg.serverPath);
                                }
                                options.list.push(msg);
                                if(fs.existsSync(msg.localPath)){
                                    fs.unlinkSync(msg.localPath);
                                }
                                break;
                            default:
                                if(options.quiet){
                                    console.log("unknown child message");
                                }
                        }
                        parent(options);
                    })
                    .on('exit', ()=>{
                        log.child--;
                        if(log.child == 0){
                            options.callback(log, errorList);
                        }
                    });
    
        options.list.shift();
    }

    let log = {};

    log.exist = 0;
    log.noResource = 0;
    log.download = 0;
    log.error = 0;
    log.child = 0;
    
    let errorList = [];

    for (let i = 0; i < options.cpus; i++){
        parent(options);
    }
}

if(module.parent){
    module.exports = wgdown;
}else{
// child

// result
// '0' init
// '1' local exists
// '2' not exist in server
// '3' download but problem
// '0' downloaded 
// '5' error
    return new Promise((resolve, reject)=>{
        let msg = {
            serverPath: process.argv[2],
            localPath: process.argv[3],
            size: 0,
            result: '0'
        };

        if(fs.existsSync(msg.localPath)){
            msg.result = '1';
            process.send(JSON.stringify(msg));
            resolve();
            return ;
        }

        let rs = request(msg.serverPath);
        rs.on('error', (err)=>{
                console.log("error:  " + msg.serverPath + "   " + err);
                msg.result = '5';
                process.send(JSON.stringify(msg));
                resolve();
                return ;
                })
        .on('response', (response)=>{
            if(response.statusCode == 200){
            // console.log("download :  " + msg.serverPath);
            // console.log("content-length:  " +  response.headers["content-length"]);
                size = response.headers["content-length"];
                let ws = fs.createWriteStream(msg.localPath);
                rs.pipe(ws.on('error',(err)=>{
                        console.log(msg.localPath);
                        console.log(err);
                        ws.end();
                        msg.result = '5';
                        process.send(JSON.stringify(msg));
                        resolve();
                        return ;
                    })
                    .on('finish',()=>{
                        // console.log(msg.localPath + ' finished');
                        if( size > ws.bytesWritten){
                        // console.log("problem @:  "  + msg.serverPath);
                            ws.end();
                            msg.result = '3';
                            process.send(JSON.stringify(msg));
                            resolve();
                            return ;
                        }
                        ws.end();
                        process.send(JSON.stringify(msg));     
                        resolve();
                        return ;
                    })
                    )
            }else{
                msg.result = '2';
                process.send(JSON.stringify(msg));
                resolve();
                return ;
            }
        })
    });
}