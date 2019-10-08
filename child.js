/**
 * wgdown ts
 * 
 * wgdown is a download tool using child process
 * 
 * @author wind2esg
 * @date 20190930
 * 
 * #child
 * 
 * result
 * '0' init
 * '1' local exists
 * '2' not exist in server
 * '3' download but problem
 * '0' downloaded 
 * '5' error
 */

const fs = require('fs');
const request = require('request');

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