import Figure from "./Figure.js";
import '../libs/tielifa.min.js';
import LoopThreadWrapper from "./LoopThreadWrapper.js";

export default class Graph extends Figure {
    constructor(canvas, p) {
        super(p);
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = new tielifa.WebGL2D(canvas, p);
        this.canvas = canvas;
        this.loopInterface = null;
        this._loop = new LoopThreadWrapper();
        let that = this;
        this._loop.repeat = function (refreshCount) {
            that.loopRefresh(refreshCount);
        };
    }

    update() {
        this.clean();
        super.update(this.ctx);
        this.ctx.draw();
    }

    get parent() {
        return null;
    }

    set parent(parent) {
    }

    clean() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSelf(ctx) {
    }

    loopRefresh() {
        if (this.loopInterface) {
            if (this.loopInterface.loopStart) {
                this.loopInterface.loopStart();
            }
        }
        this.update()
        if (this.loopInterface) {
            if (this.loopInterface.loopEnd) {
                this.loopInterface.loopEnd();
            }
        }
    }

    startLoopRefresh(loopinterface) {
        this.loopInterface = loopinterface;
        this._loop.start();
    }

    stopLoopRefresh() {
        this._loop.stop();
    }
}