import './js/libs/weapp-adapter.js';
import './js/libs/symbol.js';
import spiritsheet from "./js/Spiritsheet.js";
import Collision from "./js/Collision";

let zasi = require('./js/libs/zasi.min.js');
window.zasi = zasi;
let tielifa = require('./js/libs/tielifa.min.js');
window.tielifa = tielifa;

// let test =new spiritsheet(canvas);
// test.run();

let test = new Collision(canvas);
test.run();
