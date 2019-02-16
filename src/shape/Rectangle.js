import BaseShape from "./BaseShape.js";

export default class Rectangle extends BaseShape {
    constructor(p) {
        p = p || {};
        super(p);
        this.radius = p['radius'] || 0;
        if (this.radius < 0) throw new Error('radius should bigger than zero');
    }

    defineShapePath(ctx) {
        if (this.radius == 0) {
            ctx.rect(0, 0, this.width, this.height);
        } else {
            let min = Math.min(this.width, this.height);
            if (this.radius > min / 2) throw new Error('radius should less than half of width or height');
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(this.width - this.radius, 0);
            ctx.arc(this.width - this.radius, this.radius, this.radius, -Math.PI / 2, 0);
            ctx.lineTo(this.width, this.height - this.radius);
            ctx.arc(this.width - this.radius, this.height - this.radius, this.radius, 0, Math.PI / 2);
            ctx.lineTo(this.radius, this.height);
            ctx.arc(this.radius, this.height - this.radius, this.radius, Math.PI / 2, Math.PI);
            ctx.lineTo(0, this.radius);
            ctx.arc(this.radius, this.radius, this.radius, Math.PI, Math.PI + Math.PI / 2);
        }
    }
}