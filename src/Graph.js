import Figure from "./Figure.js";
import '../libs/tielifa.min.js';

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
        this.requestId = null;
    }

    get parent() {
        return null;
    }

    set parent(parent){}

    update(requestId) {

        if (requestId != null) {
            if (this.requestId == null) {
                this.requestId = requestId;
            }
        }
        if (this.requestId != requestId && this.requestId != null) {
            // 这说明有一个动画正在运行中
            // console.log(this.runningAnimation);
            return;
        }
        this.clean();
        this.draw(this.ctx);
        this.ctx.draw();
    }

    releaseUpdateRequest(id) {
        if (this.requestId == id) {
            this.requestId = null;
        }
    }

    clean() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawSelf(ctx) {
    }
}