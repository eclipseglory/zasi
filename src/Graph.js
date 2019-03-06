import Figure from "./Figure.js";
import LoopThreadWrapper from "./LoopThreadWrapper.js";

let _paused = Symbol('暂停循环刷新是否已暂停');

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
        this[_paused] = false;
    }

    loadImage(id, src, callbacks, properties) {
        this.ctx.loadImage(id, src, callbacks, properties);
    }

    getTexture(id, index) {
        return this.ctx.getTexture(id, index);
    }

    get paused() {
        return this[_paused];
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
        if (this.paused) return;
        this.update();
        if (this.loopInterface) {
            if (this.loopInterface.loopEnd) {
                this.loopInterface.loopEnd();
            }
        }
    }

    pause() {
        this[_paused] = true;
    }

    startLoopRefresh(loopinterface) {
        if (this.paused) {
            this[_paused] = false;
            return;
        }
        this.loopInterface = loopinterface;
        this._loop.start();
    }

    stopLoopRefresh() {
        this._loop.stop();
    }
}