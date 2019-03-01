import Figure from "./Figure.js";

let _physicsModel = Symbol('figure的物理模型');
let _mass = Symbol('质量');
let _inertia = Symbol('转动惯量');
let _contactable = Symbol('是否可碰撞，true则会进行碰撞测试，反之不会');
export default class EntityFigure extends Figure {
    constructor(p) {
        p = p || {};
        super(p);
        if (p['contactable'] != undefined) {
            this[_contactable] = p['contactable']
        } else
            this[_contactable] = true;
        this.physicsModel = p['physicsModel'] || p;
        this[_inertia] = undefined;
        this[_mass] = p['mass'] || 1;
    }

    get contactable() {
        return this[_contactable];
    }

    set contactable(c) {
        this[_contactable] = c;
    }

    set physicsModel(model) {
        this[_physicsModel] = model;
    }

    get physicsModel() {
        return this[_physicsModel];
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