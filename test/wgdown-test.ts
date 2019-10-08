/**
 * wgdown-test ts
 *
 * test for wgdown
 *
 * @author wind2esg
 * @date 20191008
 *
 */

import { Log, Options, DownloadTarget, Wgdown } from "../src/index";

let list: Array<DownloadTarget> = [];

for (let i:number = 0; i < 10; i++){
    let target:DownloadTarget = {serverPath: "http://b.hiphotos.baidu.com/image/pic/item/32fa828ba61ea8d3fcd2e9ce9e0a304e241f5803.jpg", localPath: `./test/${i}.jpg`};
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

let wgdown: Wgdown = new Wgdown(options, './dist/src/child');

wgdown.download();