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
    }

    update(){
        this.draw(this.ctx);
        this.ctx.draw();
    }

    drawSelf(ctx) {
    }
}