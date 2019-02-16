import BaseShape from "./BaseShape.js";

export default class Rectangle extends BaseShape {
    constructor(p) {
        super(p);
        this.round = p['round'] || 0;
    }

    defineShapePath(ctx) {
        ctx.rect(0, 0, this.width, this.height, this.depth);
    }
}