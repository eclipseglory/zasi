import Dimension3 from "./common/Dimension3.js";
import List from "./common/List.js";

let _id = Symbol('figure对象的唯一标示');
let _bounds = Symbol('figure左上角坐标点以及大小的一个数组,0位是x,1位是y,2位是z,3位是width,4位是height');
let _rp = Symbol('figure的旋转伸缩锚点所在figurebounds的百分比,0-1');
let _transformCalculator = Symbol('figure旋转拉伸所在锚点的计算方法');
let _children = Symbol('子figure列表');
let _parent = Symbol('父figure');
let _scale = Symbol('缩放数组,0位是x缩放，1位是y缩放，2位是z缩放');
let _rotate = Symbol('旋转角度数组,0位是x轴角度，1位是y轴角度，2位是z轴角度');
let _opacity = Symbol('figure的透明度,0 - 1');
let _visible = Symbol('figure是否显示 , boolean值');
let _methods = Symbol('figure事件map');
let _defaultAnchor = Symbol('默认转换锚点');
let GLOBAL_ID = 0;

const PIDIV180 = Math.PI / 180;

export default class Figure {

    constructor(properties) {
        properties = properties || {};
        this[_id] = GLOBAL_ID++;
        this[_defaultAnchor] = new Dimension3();
        this[_bounds] = new Float32Array(5);
        this[_bounds][0] = properties['x'] || 0;
        this[_bounds][1] = properties['y'] || 0;
        this[_bounds][2] = properties['z'] || 0;
        this[_bounds][3] = properties['width'] || 0;
        this[_bounds][4] = properties['height'] || 0;

        this[_scale] = new Dimension3();
        this[_scale].x = properties['scaleX'] || 1;
        this[_scale].y = properties['scaleY'] || 1;
        this[_scale].z = properties['scaleZ'] || 1;

        this[_rotate] = new Dimension3();
        this[_rotate].x = properties['rotateX'] || 0;
        this[_rotate].y = properties['rotateY'] || 0;
        this[_rotate].z = properties['rotate'] || 0;

        this[_opacity] = properties["opacity"] || 1;
        this.parent = null;
        this[_methods] = [];
        this[_visible] = properties['visible'] || true;
        this[_transformCalculator] = null;
        this[_children] = new List();
    }

    get transformAnchorCalculator() {
        return this[_transformCalculator];
    }

    set transformAnchorCalculator(c) {
        this[_transformCalculator] = c;
    }

    get opacity() {
        return this[_opacity];
    }

    set opacity(opacity) {
        this[_opacity] = opacity;
    }

    /**
     * Figure's ID(read-only)
     * @returns {*}
     * @constructor
     */
    get Id() {
        return this[_id];
    }

    /**
     * Figure's right x-axis value(read-only)
     * @returns {*}
     */
    get right() {
        return this.left + this.width;
    }

    /**
     * Figure's bottom y-axis value(read-only)
     * @returns {*}
     */
    get bottom() {
        return this.top + this.height;
    }

    get x() {
        return this.left;
    }

    set x(value) {
        this.left = value;
    }

    get y() {
        return this.top;
    }

    set y(value) {
        this.top = value;
    }

    get z() {
        return this.depth;
    }

    set z(value) {
        this.depth = value;
    }

    get left() {
        return this[_bounds][0];
    }

    set left(value) {
        this[_bounds][0] = value;
    }

    get top() {
        return this[_bounds][1];
    }

    set top(value) {
        this[_bounds][1] = value;
    }

    get depth() {
        return this[_bounds][2];
    }

    set depth(value) {
        this[_bounds][2] = value;
    }

    get width() {
        return this[_bounds][3];
    }

    set width(value) {
        this[_bounds][3] = value;
    }

    get height() {
        return this[_bounds][4];
    }

    set height(value) {
        this[_bounds][4] = value;
    }

    get allRotate() {
        return this[_rotate];
    }

    get rotate() {
        return this[_rotate].z;
    }

    set rotateX(value) {
        this[_rotate].x = value;
    }

    get rotateX() {
        return this.allRotate.x
    }

    set rotateY(value) {
        this[_rotate].y = value;
    }

    get rotateY() {
        return this.allRotate.y;
    }

    set rotate(value) {
        this[_rotate].z = value;
    }

    get allScale() {
        return this[_scale];
    }

    get scaleX() {
        return this.allScale.x;
    }

    get scaleY() {
        return this.allScale.y;
    }

    get scaleZ() {
        return this.allScale.z;
    }

    set scaleX(value) {
        this.allScale.x = value;
    }

    set scaleY(value) {
        this.allScale.y = value;
    }

    set scaleZ(value) {
        this.allScale.z = value;
    }

    get children() {
        return this[_children];
    }

    get visible() {
        return this[_visible]
    }

    set visible(flag) {
        this[_visible] = flag;
    }

    /****************************** 以上是属性 ************************/

    drawSelf(ctx) {


    }

    draw(ctx) {
        ctx.save();
        this.applyTransform(ctx);
        this.applyDrawingStyle(ctx);
        this.drawSelf(ctx);
        this.drawChildren(ctx);
        ctx.restore();
    }

    applyTransform(ctx) {

        let transformAnchor = this.getTransformAnchor();
        let anchorX = transformAnchor.x;
        let anchorY = transformAnchor.y;
        let anchorZ = transformAnchor.z;
        ctx.translate(this.left, this.top, this.depth);

        if (this.rotate != 0 || this.rotateX != 0 || this.rotateY != 0) {
            ctx.translate(anchorX, anchorY, anchorZ);
            ctx.rotate(this.rotate * PIDIV180);
            ctx.rotateX(this.rotateX * PIDIV180);
            ctx.rotateY(this.rotateY * PIDIV180);
            ctx.translate(-anchorX, -anchorY, -anchorZ);
        }

        if (this.scaleX != 1 || this.scaleY != 1 || this.scaleZ != 1) {
            ctx.scale(this.scaleX, this.scaleY, this.scaleZ);
            let newx = anchorX / this.scaleX - anchorX;
            let newy = anchorY / this.scaleY - anchorY;
            let newz = anchorZ / this.scaleZ - anchorZ;
            ctx.translate(newx, newy, newz);
        }
    }

    applyDrawingStyle(ctx) {
        ctx.globalAlpha = this.opacity;
    }

    drawChildren(ctx) {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children.get(i);
            if (!child.visible) continue;
            child.draw(ctx);
        }
    }

    getTransformAnchor() {
        if (this.transformAnchorCalculator) {
            return this.transformAnchorCalculator(this);
        } else
            return this.getDefaultTransformAnchor();
    }

    getDefaultTransformAnchor() {
        this[_defaultAnchor].x = this.width / 2;
        this[_defaultAnchor].y = this.height / 2;
        this[_defaultAnchor].z = this.depth / 2;
        return this[_defaultAnchor];
    }

    addChild(child){
        this[_children].add(child);
    }

    removeChild(child){
        this[_children].remove(child);
    }
}