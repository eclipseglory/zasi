import BaseShape from "./BaseShape.js";

export default class Ellipse extends BaseShape {
    constructor(p) {
        p = p || {};
        super(p);
        this.radiusX = p['radiusX'] || 0;
        this.radiusY = p['radiusY'] || 0;
        this.centerX = p['centerX'] || 0;
        this.centerY = p['centerY'] || 0;
    }

    get centerX() {
        return this.left + this.radiusX;
    }

    set centerX(value) {
        this.left = value - this.radiusX;
    }

    get centerY() {
        return this.top + this.radiusY;
    }

    set centerY(value) {
        this.top = value - this.radiusY;
    }

    get radiusX() {
        return this.width / 2;
    }

    set radiusX(value) {
        this.width = value * 2;
    }

    get radiusY() {
        return this.height / 2;
    }

    set radiusY(value) {
        this.height = value * 2;
    }

    get width() {
        return super.width;
    }

    get height() {
        return super.height;
    }

    set width(value) {
        super.width = value;
    }

    set height(value) {
        super.height = value;
    }

    defineShapePath(ctx) {
        ctx.ellipse(this.radiusX, this.radiusY, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
    }
}