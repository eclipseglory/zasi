import Figure from "./Figure.js";

let _mass = Symbol('质量');
let _inertia = Symbol('转动惯量');
export default class EntityFigure extends Figure {
    constructor(p) {
        p = p || {};
        super(p);
        if (p['contactable'] != undefined) {
            this.contactable = p['contactable']
        } else
            this.contactable = true;
        this.physicsModel = p['physicsModel'];
        this[_inertia] = undefined;
        this[_mass] = p['mass'] || 1;
    }


    get mass() {
        return this[_mass];
    }

    set mass(mass) {
        this[_mass] = mass;
    }

    get momentInertia() {
        if (this.mass == Infinity) return Infinity;
        if (this.physicsModel == null) {
            if (this[_inertia] == undefined) {
                // 默认的转动惯量是绕中心转的2d矩形的转动惯量： I = m*(w^2 + h^2)/12;
                this[_inertia] = this.mass * (this.width * this.width + this.height * this.height) / 12;
            }
            return this[_inertia];
        } else {
            return this.physicsModel.momentInertia;
        }
    }

    get inverseInertia() {
        if (this.mass == Infinity) return 0;
        return 1 / this.momentInertia;
    }

    get inverseMass() {
        if (this.mass == Infinity) return 0;
        return 1 / this.mass;
    }


}