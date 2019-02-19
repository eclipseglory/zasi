import AbstractSpirit from "./AbstractSpirit.js";

export default class TestRectSpirit extends AbstractSpirit {
    constructor(p) {
        super(p);
        this.color = p['color'] || 'white';
    }

    drawSelf(ctx) {
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}