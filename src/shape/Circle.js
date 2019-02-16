import Ellipse from "./Ellipse.js";

export default class Circle extends Ellipse {
    constructor(p) {
        p = p || {};
        super(p);
        this.radius = p['radius'] || 0;
    }

    get radius(){
        return this.radiusX;
    }

    set radius(r){
        this.radiusX = r;
    }

    get width() {
        return super.width;
    }

    get height() {
        return super.height;
    }

    set width(value) {
        super.width = value;
        super.height = value;
    }

    set height(value) {
        this.width = value;
    }
}