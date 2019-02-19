import Tools from "../utils/Tools.js";
import Figure from "../Figure.js";
import List from "../common/List.js";
import Point2D from "../common/Point2D.js";
import LoopThreadWrapper from "../LoopThreadWrapper.js";
import '../../libs/tielifa.min.js';
import World from "../World.js";

let _velocity = Symbol('速度');
let _angularVelocity = Symbol('角速度');
let _force = Symbol('受力');
let _forcePosition = Symbol('受力位置');
let _mass = Symbol('质量');
let _acceleration = Symbol('加速度');
let _sleepx = Symbol('x轴休眠');
let _sleepy = Symbol('y轴休眠');
let _sleepRotate = Symbol('旋转休眠');
let _massCenter = Symbol('质心');
let _inertia = Symbol('转动惯量');

let _preVelocity = Symbol('前一时刻的速度');
let _preAngularVelocity = Symbol('前一时刻的角速度');
let _prePosition = Symbol('前一时间的位置');
let _preRotation = Symbol('前一时刻的旋转度数');
let _physicsModel = Symbol('figure的物理模型');
let _contactable = Symbol('是否可碰撞，true则会进行碰撞测试，反之不会');

const DELTA_TIME = 1;//1000 / 60;
const RADIAN_TO_ANGEL_CONST = 180 / Math.PI;
const ANGEL_TO_RADIAN_CONST = Math.PI / 180;
export default class AbstractSpirit extends Figure {
    constructor(p) {
        p = p || {};
        super(p);
        this[_contactable] = true;
        this[_preVelocity] = new tielifa.Vector2(0, 0);
        this[_prePosition] = new Point2D(0, 0);
        this[_preAngularVelocity] = 0;
        this[_mass] = p['mass'] || 1;
        this[_velocity] = p['velocity'] || new tielifa.Vector2(0, 0);
        this[_force] = p['force'] || new tielifa.Vector2(0, 0);
        this[_angularVelocity] = p['angularVelocity'] || 0;
        this[_acceleration] = new tielifa.Vector2(0, 0);
        this[_sleepx] = false;
        this[_sleepy] = false;
        this[_inertia] = undefined;
        // 质心位置默认是在中心
        this[_massCenter] = p['massCenter'];
        this.thread = new LoopThreadWrapper();
        let that = this;
        this.thread.repeat = function (refreshCount) {
            that.repeat(refreshCount);
        };
        this.beforeRepeat = new List();
        this.afterRepeat = new List();
    }

    get contactable() {
        return this[_contactable];
    }

    set contactable(c) {
        this[_contactable] = c;
    }

    get physicsModel() {
        return this[_physicsModel];
    }


    addAfterRepeatListener(listener) {
        this.afterRepeat.add(listener);
    }

    addBeforeRepeatListener(listener) {
        this.beforeRepeat.add(listener);
    }

    removeAfterRepeatListener(listener) {
        this.afterRepeat.remove(listener);
    }

    removeBeforeRepeatListener(listener) {
        this.beforeRepeat.remove(listener);
    }

    static get DELTA_TIME() {
        return DELTA_TIME;
    }

    get forcePosition() {
        // 默认受力点是中心
        if (this[_forcePosition] == undefined) {
            this[_forcePosition] = new Point2D(this.width / 2, this.height / 2);
        }
        return this[_forcePosition];
    }

    set forcePosition(forcePosition) {
        this.forcePosition.x = forcePosition.x;
        this.forcePosition.y = forcePosition.y;
    }


    /**
     * 利用AABB（Axis-Aligned Bounding Boxes）进行测试，看两个figure投影是否相交，可以初略判断出figure是否接触
     * @param figure
     * @returns {boolean}
     */
    overlap(figure) {
        let a = this.getSelectBounds();
        let b = figure.getSelectBounds();
        return Tools.overlaps(a, b);
    }

    get isStaticFigure() {
        return (this.mass == Infinity);
    }

    get inverseInertia() {
        if (this.mass == Infinity) return 0;
        return 1 / this.momentInertia;
    }

    get momentInertia() {
        if (this.mass == Infinity) return Infinity;
        if(this[_physicsModel] == null){
            if (this[_inertia] == undefined) {
                // 默认的转动惯量是绕中心转的2d矩形的转动惯量： I = m*(w^2 + h^2)/12;
                this[_inertia] = this[_mass] * (this.width * this.width + this.height * this.height) / 12;
            }
            return this[_inertia];
        }else{
            return this[_physicsModel].momentInertia;
        }
    }

    get isSleeping() {
        return this.velocity.x == 0 && this.velocity.y == 0 && this.angularVelocity == 0;
    }

    get sleepX() {
        return this[_sleepx];
    }

    get sleepY() {
        return this[_sleepy];
    }

    get inverseMass() {
        if (this.mass == Infinity) return 0;
        return 1 / this.mass;
    }

    get mass() {
        return this[_mass];
    }

    get massCenter() {
        if (this[_massCenter] == undefined) {
            this[_massCenter] = new Point2D(this.center.x, this.center.y);
        }
        return this[_massCenter];
    }

    set massCenter(massCenter) {
        this[_massCenter].x = massCenter.x;
        this[_massCenter].y = massCenter.y;
    }

    set mass(mass) {
        this[_mass] = mass;
    }

    get angularVelocity() {
        return this[_angularVelocity];
    }

    set angularVelocity(v) {
        this[_angularVelocity] = v;
    }

    get speed() {
        return this.velocity.magnitude;
    }

    get velocity() {
        return this[_velocity];
    }

    set velocity(velocity) {
        this[_velocity].x = velocity.x;
        this[_velocity].y = velocity.y;
    }

    get force() {
        return this[_force];
    }

    set force(force) {
        this[_force].x = force.x;
        this[_force].y = force.y;
    }

    get acceleration() {
        this[_acceleration].x = this.force.x * this.inverseMass;
        this[_acceleration].y = this.force.y * this.inverseMass;
        return this[_acceleration];
    }

    get angularAcceleration() {
        return this.torque * this.inverseInertia;
    }

    get nextFrameVelocity() {

    }

    get preRotate() {
        return this[_preRotation];
    }

    get preVelocity() {
        return this[_preVelocity];
    }

    get prePosition() {
        return this[_prePosition];
    }

    get preAngularVelocity() {
        return this[_preAngularVelocity];
    }

    get torque() {
        // 默认扭矩是绕质心点轴的，所以R叉乘F即是：Rx * Fx - Ry *Fy ,R就是受力点到质心的距离
        // let R = {x: this.forcePosition.x - this.center.x, y: this.forcePosition.y - this.center.y};
        // let testValue = Vector2.cross(R,this.force);
        let tx = (this.forcePosition.x - this.massCenter.x) * this.force.x;
        let ty = (this.forcePosition.y - this.massCenter.y) * this.force.y;
        return tx - ty;
    }

    backToPre() {
        this.left = this.prePosition.x;
        this.top = this.prePosition.y;
        this.rotate = this.preRotate;
        this.velocity.x = this.preVelocity.x;
        this.velocity.y = this.preVelocity.y;
        this.angularVelocity = this.preAngularVelocity;
    }

    repeat(refreshCount) {
        if (this.beforeRepeat) {
            for (let i = 0; i < this.beforeRepeat.length; i++) {
                this.beforeRepeat.get(i)({figure: this, refreshCount: refreshCount});
            }
        }
        let acceleration = this.acceleration;
        let angularAcceleration = this.angularAcceleration;
        // 线性速度计算：
        this[_preVelocity].x = this.velocity.x;
        this[_preVelocity].x = this.velocity.y;
        let cx = this.velocity.x + acceleration.x * DELTA_TIME;
        let cy = this.velocity.y + acceleration.y * DELTA_TIME;
        let sleepx = false;
        let sleepy = false;
        // 如果当前速度和下一帧速度之和为0或者速度方向相反，说明这个时刻是静止的
        if (cx * this.velocity.x < 0 || Math.abs(cx + this.velocity.x) <= Tools.EPSILON) {
            sleepx = true;
        }
        if (cy * this.velocity.y < 0 || Math.abs(cy + this.velocity.y) <= Tools.EPSILON) {
            sleepy = true;
        }

        this.velocity.x = cx;
        this.velocity.y = cy;
        this[_prePosition].x = this.left;
        this[_prePosition].y = this.top;
        this.left += this.velocity.x * DELTA_TIME;
        this.top += this.velocity.y * DELTA_TIME;

        // 角速度计算
        this[_preAngularVelocity] = this.angularVelocity;
        let currentAngularVelocity = angularAcceleration * DELTA_TIME + this.angularVelocity;
        // 旋转反向，说明当前旋转静止
        let sleepRotate = false;
        if (currentAngularVelocity * this.angularVelocity < 0 || Math.abs(currentAngularVelocity + this.angularVelocity) <= (Tools.EPSILON / 1000)) {
            sleepRotate = true;
        }
        this.angularVelocity = currentAngularVelocity;
        this[_preRotation] = this.rotate;
        this.rotate += this.angularVelocity * DELTA_TIME * RADIAN_TO_ANGEL_CONST;
        let that = this;
        if (sleepRotate && !this[_sleepRotate]) {
            this.fireEvent('sleepRotate', {
                source: this
            });
            this[_sleepRotate] = true;
        }
        if (sleepx && !this[_sleepx]) {
            this.fireEvent('sleepX', {source: this});
            this[_sleepx] = true;
        }
        if (sleepy && !this[_sleepy]) {
            this.fireEvent('sleepY', {source: this});
            this[_sleepy] = true;
        }

        if (this.afterRepeat) {
            for (let i = 0; i < this.afterRepeat.length; i++) {
                this.afterRepeat.get(i)({figure: this, refreshCount: refreshCount});
            }
        }
    }

    set physicsModel(model) {
        this[_physicsModel] = model;
    }

    get physicsModel() {
        return this[_physicsModel];
    }

    startMove() {
        this[_sleepx] = false;
        this[_sleepy] = false;
        this[_sleepRotate] = false;
        let world = this.getGraph();
        if (world instanceof World) {
            this.addAfterRepeatListener(world.monitorSpiritAfterMove);
            this.addBeforeRepeatListener(world.monitorSpiritBeforeMove);
        }
        this.thread.start();
    }

    endMove() {
        this[_sleepx] = true;
        this[_sleepy] = true;
        this[_sleepRotate] = true;
        let world = this.getGraph();
        if (world instanceof World) {
            this.removeAfterRepeatListener(world.monitorSpiritAfterMove);
            this.removeBeforeRepeatListener(world.monitorSpiritBeforeMove);
        }
        this.thread.stop();
    }
}