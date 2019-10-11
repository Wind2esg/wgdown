# wgdown  
[![Build Status](https://travis-ci.org/Wind2esg/wgdown.svg?branch=master)](https://travis-ci.org/Wind2esg/wgdown)
[![Build Status](https://img.shields.io/npm/l/wgdown)](https://www.npmjs.com/package/wgdown)
[![Build Status](https://img.shields.io/npm/v/wgdown)](https://www.npmjs.com/package/wgdown)
[![Build Status](https://img.shields.io/npm/dm/wgdown)](https://www.npmjs.com/package/wgdown)

A download tool of node with multi-process feature.  

Basic is `request` , `pipe` and `writeStream`.  

However when using this async, download uncompletely problems come.
This tool uses child_process to act async download and Retry if the file is download uncompletely.

## key points
+ `options.list` A queue maintains resource url and local download path.
+ Child processes consume the item in queue. Push the item back to the queue for retrying. `shift()` follows `fork()` because of async.
+ Compare `response.header["content-length"]` with `WriteStream.bytesWritten` to check whether the file is complete. if not, retry.
+ When error occurs, Retry.
+ Child processes send message to the parent process, which is checking or downloading result of the current item. On recieving message, parent process would decide retry or not by operating the queue depending on message.
+ Record the number of child processes. When the number reaches 0, it means no child processes currently, that is, download finished. callback here.

## useage
### install
`npm install -save wgdown`

### use
+ for commonjs  
`require('wgdown')(options, childPath = <default>);`
+ for ts  
`new Wgdown(options, childPath = <default>).download();`

### params
+ `options.list` An object array. The object in it contains the target resource url `object.serverPath` and your local path `object.localPath`.
+ `options.cpus` Numbers of the child processes. Commonly, it is the number of cpus.
+ `options.errorLimit` It would retry the url if times of error under `errorLimit`.
+ `options.callback(log, errorList)` Callback when then job done.
  + `log` It is a log for the job. `exist` How many files are already at local. `noResource` The number of files which don't exist on server. `download` The number of files downloaded. `error` How many files couldn't be downloaded because of error. `child` Stands for the number of child processes.
  + `errorList` It is the list of `object.serverPath`, recording urls not be downloaded.
+ `options.quiet` if `false`, print information. default `true`.

+ `childPath` is your package_path with default value `'./node_modules/wgdown/dist/src/child'`. PLEASE NOTICE according to `child_process.fork()`, this path is just file path, different with `require()` resolveing path.
### example
+ for commonjs
```
downloadList.push({serverPath:<resource url>, localPath:<local path>});

require('wgdown')({
      list: downloadList,
      cpus: require('os').cpus().length,
      errorLimit: 4,
      callback: (log, errorList)=>{
        console.log(log);
        if(errorList.length != 0){
          console.log(errorList);
        }
      }
    });
```
+ for ts  
```
import { Log, Options, DownloadTarget, Wgdown } from "wgdown";

let list: Array<DownloadTarget> = [];

for (let i:number = 0; i < 10; i++){
    let target:DownloadTarget = {serverPath: "http://some/some.jpg", localPath: `./test/${i}.jpg`};
    list.push(target);
}

let options = {} as Options;
options.list = list;
options.cpus = 4;
options.errorLimit = 2;
options.quiet = true;
options.callback = (log: Log, errorList: Array<string>)=>{
    console.log(log);
    console.log(errorList);
};

let wgdown: Wgdown = new Wgdown(options);

wgdown.download();
```