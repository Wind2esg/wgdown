# wgdown
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
`require('wgdown')(options);`

+ `options.list` An object array. The object in it contains the target resource url `object.serverPath` and your local path `object.localPath`.
+ `options.cpus` Numbers of the child processes. Commonly, it is the number of cpus.
+ `options.errorLimit` It would retry the url if times of error under `errorLimit`.
+ `options.callback(log, errorList)` Callback when then job done.
  + `log` It is a log for the job. `exist` How many files are already at local. `noResource` The number of files which don't exist on server. `download` The number of files downloaded. `error` How many files couldn't be downloaded because of error. `child` Stands for the number of child processes.
  + `errorList` It is the list of `object.serverPath`, recording urls not be downloaded.
+ `options.quiet` if `false`, print information. default `true`.
### example
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