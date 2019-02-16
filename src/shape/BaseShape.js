import Figure from "../Figure.js";

export default class BaseShape extends Figure {
    constructor(p) {
        p = p || {};
        super(p);
        this.color = p['color'] || 'black';
        this.borderColor = p['borderColor'];
        this.borderWidth = p['borderWidth'] || 0;
    }

    applyDrawingStyle(ctx) {
        super.applyDrawingStyle(ctx);
        ctx.fillStyle = this.color;
        if (this.borderColor) {
            ctx.strokeStyle = this.borderColor;
        }
        ctx.lineWidth = this.borderWidth;
    }

    drawSelf(ctx) {
        ctx.beginPath();
        this.defineShapePath(ctx);
        ctx.closePath();
        ctx.fill();
        if (this.borderColor) {
            ctx.stroke();
        }
    }

    defineShapePath(ctx) {

    }
}