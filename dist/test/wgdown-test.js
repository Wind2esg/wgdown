"use strict";
/**
 * wgdown-test ts
 *
 * test for wgdown
 *
 * @author wind2esg
 * @date 20191008
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
let list = [];
for (let i = 0; i < 10; i++) {
    list.push({ serverPath: "http://b.hiphotos.baidu.com/image/pic/item/32fa828ba61ea8d3fcd2e9ce9e0a304e241f5803.jpg", localPath: `./test/${i}.jpg` });
}
let options = {};
options.list = list;
options.cpus = 4;
options.errorLimit = 2;
options.quiet = true;
options.callback = (log, errorList) => {
    console.log(log);
    console.log(errorList);
};
let wgdown = new index_1.Wgdown(options, './child');
wgdown.download();
