import Dimension3 from "./common/Dimension3.js";
import List from "./common/List.js";
import Tools from "./utils/Tools.js";
import "../libs/tielifa.min.js";
import FigureEvent from "./FigureEvent.js";

let _id = Symbol('figure对象的唯一标示');
let _bounds = Symbol('figure左上角坐标点以及大小的一个数组,0位是x,1位是y,2位是z,3位是width,4位是height');
let _transformCalculator = Symbol('figure旋转拉伸所在锚点的计算方法');
let _children = Symbol('子figure列表');
let _parent = Symbol('父figure');
let _scale = Symbol('缩放数组,0位是x缩放，1位是y缩放，2位是z缩放');
let _rotate = Symbol('旋转角度数组,0位是x轴角度，1位是y轴角度，2位是z轴角度');
let _opacity = Symbol('figure的透明度,0 - 1');
let _visible = Symbol('figure是否显示 , boolean值');
let _methods = Symbol('figure事件map');
let _defaultAnchor = Symbol('默认转换锚点');
let _relatedRegion = Symbol('Figure所在的区域');
let _selfBounds = Symbol('figure相对于自身的bounds');
let _contentChanged = Symbol('Figure内部绘制是否发生了改变');
let _transformChanged = Symbol('Figure坐标、旋转、伸缩是否发生了改变');
let _transformMatrix = Symbol('figure自身的变换4x4矩阵');
let _center = Symbol('figure的中心位置');
let GLOBAL_ID = 0;

const EVENT_ADD_CHILD = 'add_child';
const EVENT_REMOVE_CHILD = 'remove_child';
const EVENT_BEFORE_DRAW_SELF = 'before_draw_self';
const EVENT_AFTER_DRAW_SELF = 'after_draw_self';

const FIGURE_EVENT = {name: null, figure: null, property: null};
export default class Figure {

    constructor(properties) {
        properties = properties || {};
        this[_id] = GLOBAL_ID++;
        this.autoIgnoreOutsizeChild = properties['autoIgnore'] || false;
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
        this[_relatedRegion] = [];
        this[_selfBounds] = {left: 0, top: 0, right: this.width, bottom: this.height};
        this.relativeBounds = {left: 0, top: 0, right: this.width, bottom: this.height, width: 0, height: 0};
        this[_transformMatrix] = tielifa.Mat4.identity();
        this.relativeMatrix = tielifa.Mat4.identity();
        this[_transformChanged] = true;
        this[_contentChanged] = true;
        this[_center] = new Dimension3();
        this._tempP1 = new Float32Array(4);
        this._tempP2 = new Float32Array(4);
        this._tempP3 = new Float32Array(4);
        this._tempP4 = new Float32Array(4);
    }

    static get EVENT_ADD_CHILD() {
        return EVENT_ADD_CHILD
    }

    static get EVENT_REMOVE_CHILD() {
        return EVENT_REMOVE_CHILD
    }

    static get EVENT_AFTER_DRAW_SELF() {
        return EVENT_AFTER_DRAW_SELF
    }

    static get EVENT_BEFORE_DRAW_SELF() {
        return EVENT_BEFORE_DRAW_SELF
    }

    get center() {
        this[_center].x = this.width / 2;
        this[_center].y = this.height / 2;
        this[_center].z = this.depth / 2;
        return this[_center];
    }

    get childrenSize() {
        return this[_children].length;
    }

    get parent() {
        return this[_parent];
    }

    set parent(parent) {
        this[_parent] = parent;
    }

    get relatedRegions() {
        return this[_relatedRegion];
    }

    set relatedRegions(array) {
        this[_relatedRegion] = array;
    }

    get isContentChanged() {
        return this[_contentChanged];
    }

    fireContentChange(changed) {
        this[_contentChanged] = changed;
    }

    get isTransformChanged() {
        return this[_transformChanged];
    }

    fireTransformChange(changed) {
        this[_transformChanged] = changed;
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
        if (Tools.equals(opacity, this[_opacity])) {
            return;
        }
        this[_opacity] = opacity;
        this.fireContentChange(true);
    }

    update(ctx) {
        ctx.save();
        this.beforeDraw(ctx);
        this.applyTransform(ctx);
        this.applyDrawingStyle(ctx);
        this.drawSelf(ctx);
        this.afterDraw(ctx);
        this.updateChildren(ctx);
        ctx.restore();

    }

    beforeDraw(ctx) {
        FIGURE_EVENT.name = EVENT_BEFORE_DRAW_SELF;
        FIGURE_EVENT.figure = this;
        this.fireEvent(EVENT_BEFORE_DRAW_SELF, FIGURE_EVENT);
    }

    afterDraw(ctx) {
        FIGURE_EVENT.name = EVENT_AFTER_DRAW_SELF;
        FIGURE_EVENT.figure = this;
        this.fireEvent(EVENT_BEFORE_DRAW_SELF, FIGURE_EVENT);
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
        if (Tools.equals(value, this[_bounds][0])) {
            return;
        }
        this[_bounds][0] = value;
        this.fireTransformChange(true);
    }

    get top() {
        return this[_bounds][1];
    }

    set top(value) {
        if (Tools.equals(value, this[_bounds][1])) {
            return;
        }
        this[_bounds][1] = value;
        this.fireTransformChange(true);
    }

    get depth() {
        return this[_bounds][2];
    }

    set depth(value) {
        if (Tools.equals(value, this[_bounds][2])) {
            return;
        }
        this[_bounds][2] = value;
        this.fireTransformChange(true);
    }

    get width() {
        return this[_bounds][3];
    }

    set width(value) {
        if (Tools.equals(value, this[_bounds][3])) {
            return;
        }
        this[_bounds][3] = value;
        this.fireContentChange(true);
    }

    get height() {
        return this[_bounds][4];
    }

    set height(value) {
        if (Tools.equals(value, this[_bounds][4])) {
            return;
        }
        this[_bounds][4] = value;
        this.fireContentChange(true);
    }

    get rotate() {
        return this[_rotate].z;
    }

    set rotateX(value) {
        value = value % 360;
        if (Tools.equals(value, this[_rotate].x)) {
            return;
        }
        this[_rotate].x = value;
        this.fireTransformChange(true);
    }

    get rotateX() {
        return this[_rotate].x
    }

    set rotateY(value) {
        value = value % 360;
        if (Tools.equals(value, this[_rotate].y)) {
            return;
        }
        this[_rotate].y = value;
        this.fireTransformChange(true);
    }

    get rotateY() {
        return this[_rotate].y;
    }

    set rotate(value) {
        value = value % 360;
        if (Tools.equals(value, this[_rotate].z)) {
            return;
        }
        this[_rotate].z = value;
        this.fireTransformChange(true);
    }


    get scaleX() {
        return this[_scale].x;
    }

    get scaleY() {
        return this[_scale].y;
    }

    get scaleZ() {
        return this[_scale].z;
    }

    set scaleX(value) {
        if (Tools.equals(value, this[_scale].x)) {
            return;
        }
        this[_scale].x = value;
        this.fireTransformChange(true);
    }

    set scaleY(value) {
        if (Tools.equals(value, this[_scale].y)) {
            return;
        }
        this[_scale].y = value;
        this.fireTransformChange(true);
    }

    set scaleZ(value) {
        if (Tools.equals(value, this[_scale].z)) {
            return;
        }
        this[_scale].z = value;
        this.fireTransformChange(true);
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
    /**
     * 该方法由子类复写
     * @param ctx
     */
    drawSelf(ctx) {
    }

    applyTransform(ctx) {
        let matrix = this.getTransformMatrix();
        ctx.applyTransformMatrix(matrix);
        // 留着这段代码，免得出了bug不好恢复
        // let transformAnchor = this.getTransformAnchor();
        // let anchorX = transformAnchor.x;
        // let anchorY = transformAnchor.y;
        // let anchorZ = transformAnchor.z;
        // ctx.translate(this.left, this.top, this.depth);
        //
        // if (this.rotate != 0 || this.rotateX != 0 || this.rotateY != 0) {
        //     ctx.translate(anchorX, anchorY, anchorZ);
        //     ctx.rotate(this.rotate * Tools.PIDIV180);
        //     ctx.rotateX(this.rotateX * Tools.PIDIV180);
        //     ctx.rotateY(this.rotateY * Tools.PIDIV180);
        //     ctx.translate(-anchorX, -anchorY, -anchorZ);
        // }
        //
        // if (this.scaleX != 1 || this.scaleY != 1 || this.scaleZ != 1) {
        //     ctx.scale(this.scaleX, this.scaleY, this.scaleZ);
        //     let newx = anchorX / this.scaleX - anchorX;
        //     let newy = anchorY / this.scaleY - anchorY;
        //     let newz = anchorZ / this.scaleZ - anchorZ;
        //     ctx.translate(newx, newy, newz);
        // }
    }

    applyDrawingStyle(ctx) {
        ctx.globalAlpha = this.opacity;
    }

    updateChildren(ctx) {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children.get(i);
            if (!child.visible) continue;
            if (this.autoIgnoreOutsizeChild)
                if (this.isOutside(child)) {
                    continue;
                }
            child.update(ctx);
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

    addEventListener(name, callBack) {
        if (this[_methods][name] == null || this[_methods][name] == undefined) {
            this[_methods][name] = [];
        }
        this[_methods][name].push(callBack);
    }

    removeEventListener(name, callBack) {
        if (this[_methods][name] == null) return;
        this[_methods][name].pop(callBack);
    }

    cleanEventListener(name) {
        if (this[_methods][name] == null || this[_methods][name] == undefined) return;
        this[_methods][name].length = 0;
    }

    fireEvent(name, evt) {
        if (this[_methods][name] != null) {
            for (let index = 0; index < this[_methods][name].length; index++) {
                this[_methods][name][index](evt);
            }
        }
    }

    indexOf(child) {
        return this[_children].indexOf(child);
    }

    getGraph() {
        let graph = this.parent;
        if (!graph) {
            return this;
        }
        return graph.getGraph();
    }

    getChild(index) {
        return this[_children].get(index);
    }

    containsChild(child) {
        return this[_children].contains(child);
    }


    insertChild(child, index) {
        if (child == null) return;
        if (this.containsChild(child)) return;
        let parent = child.parent;
        if (parent) {
            parent.removeChild(child);
        }
        this[_children].insert(child, index);
        child.parent = this;
        FIGURE_EVENT.name = EVENT_ADD_CHILD;
        FIGURE_EVENT.figure = this;
        FIGURE_EVENT.property = {
            oldparent: parent,
            currentparent: this,
            child: child
        };
        this.fireEvent(EVENT_ADD_CHILD, FIGURE_EVENT);
        return child;
    }

    addChild(child) {
        if (child == null) return;
        if (this.containsChild(child)) return;
        let parent = child.parent;
        if (parent) {
            parent.removeChild(child);
        }
        this[_children].add(child);
        child.parent = this;
        FIGURE_EVENT.name = EVENT_ADD_CHILD;
        FIGURE_EVENT.figure = this;
        FIGURE_EVENT.property = {
            oldparent: parent,
            currentparent: this,
            child: child
        };
        this.fireEvent(EVENT_ADD_CHILD, FIGURE_EVENT);
        return child;
    }

    getRelativeTransformMatrix(parent) {
        let myMatrix = this.getTransformMatrix();
        if (parent == this.parent) return myMatrix;
        let m = this.relativeMatrix;
        tielifa.Mat4.identityMatrix(m);
        if (this.parent != null && this.parent != undefined) {
            tielifa.Mat4.copy(this.parent.getRelativeTransformMatrix(parent), m);
        }
        tielifa.Mat4.multiply(m, m, myMatrix);
        return m;
    }

    getTransformMatrix() {
        if (this.isTransformChanged) { // 如果发生过transform的属性改变，就要重新计算一次
            tielifa.Mat4.identityMatrix(this[_transformMatrix]); // 重置为单位矩阵
            let currentMatrix = this[_transformMatrix];
            let m = tielifa.Mat4.TEMP_MAT4[0]; // 这是要相乘的临时变化矩阵
            tielifa.Mat4.identityMatrix(m);
            let left = this.left;
            let top = this.top;
            let depth = this.depth;
            let scaleX = this.scaleX;
            let scaleY = this.scaleY;
            let scaleZ = this.scaleZ;
            let rotate = this.rotate;
            let rotateX = this.rotateX;
            let rotateY = this.rotateY;

            if (!(Tools.equals(left, 0) && Tools.equals(top, 0) && Tools.equals(depth, 0))) {
                tielifa.Mat4.translationMatrix(m, left, top, depth);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }

            let transformPoint = this.getTransformAnchor();
            let transformX = transformPoint.x;
            let transformY = transformPoint.y;
            let transformZ = transformPoint.z;

            let flag = false;
            if (!(Tools.equals(transformX, 0) && Tools.equals(transformY, 0) && Tools.equals(transformZ, 0))) {
                flag = true;
            }
            if (flag) {
                tielifa.Mat4.translationMatrix(m, transformX, transformY, transformZ);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }
            if (!Tools.equals(rotate, 0)) {
                tielifa.Mat4.rotationZMatrix(m, rotate * Tools.PIDIV180);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }
            if (!Tools.equals(rotateX, 0)) {
                tielifa.Mat4.rotationXMatrix(m, rotateX * Tools.PIDIV180);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }
            if (!Tools.equals(rotateY, 0)) {
                tielifa.Mat4.rotationYMatrix(m, rotateY * Tools.PIDIV180);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }

            if (flag) {
                tielifa.Mat4.translationMatrix(m, -transformX, -transformY, -transformZ);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }

            if (!(Tools.equals(scaleX, 1) && Tools.equals(scaleY, 1) && Tools.equals(scaleZ, 1))) {
                tielifa.Mat4.scalingMatrix(m, scaleX, scaleY, scaleZ);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }
            // 调整缩放后画布对应的老坐标的位置，
            // 这里坐标都比以前要多出scale倍，所以要让缩放后figure还是绘制在以前的坐标上，就需要让整个画布位置变化一下
            let newx = transformX / scaleX - transformX;
            let newy = transformY / scaleY - transformY;
            let newz = transformZ / scaleZ - transformZ;
            if (!(Tools.equals(newx, 0) && Tools.equals(newy, 0) && Tools.equals(newz, 0))) {
                tielifa.Mat4.translationMatrix(m, newx, newy, newz);
                tielifa.Mat4.multiply(currentMatrix, currentMatrix, m);
            }
            this.fireTransformChange(false);// 生成完就设置为没有改变过，避免以后不必要的计算操作
        }
        return this[_transformMatrix];
    }

    getRelativeBounds(parent) {
        let matrix = this.getRelativeTransformMatrix(parent);
        let left = 0;
        let right = this.width;
        let top = 0;
        let bottom = this.height;
        this._tempP1[0] = left;
        this._tempP1[1] = top;
        this._tempP1[2] = this.depth;
        this._tempP1[3] = 1;

        this._tempP2[0] = right;
        this._tempP2[1] = top;
        this._tempP2[2] = this.depth;
        this._tempP2[3] = 1;

        this._tempP3[0] = left;
        this._tempP3[1] = bottom;
        this._tempP3[2] = this.depth;
        this._tempP3[3] = 1;

        this._tempP4[0] = right;
        this._tempP4[1] = bottom;
        this._tempP4[2] = this.depth;
        this._tempP4[3] = 1;

        let p1 = tielifa.Mat4.multiplyWithVertex(matrix, this._tempP1, this._tempP1);
        let p2 = tielifa.Mat4.multiplyWithVertex(matrix, this._tempP2, this._tempP2);
        let p3 = tielifa.Mat4.multiplyWithVertex(matrix, this._tempP3, this._tempP3);
        let p4 = tielifa.Mat4.multiplyWithVertex(matrix, this._tempP4, this._tempP4);

        let lp = p1;
        if (p2[0] < lp[0]) lp = p2;
        if (p3[0] < lp[0]) lp = p3;
        if (p4[0] < lp[0]) lp = p4;

        let tp = p1;
        if (p2[1] < tp[1]) tp = p2;
        if (p3[1] < tp[1]) tp = p3;
        if (p4[1] < tp[1]) tp = p4;

        let rp = p1;
        if (p2[0] > rp[0]) rp = p2;
        if (p3[0] > rp[0]) rp = p3;
        if (p4[0] > rp[0]) rp = p4;

        let bp = p1;
        if (p2[1] > bp[1]) bp = p2;
        if (p3[1] > bp[1]) bp = p3;
        if (p4[1] > bp[1]) bp = p4;
        this.relativeBounds.left = lp[0];
        this.relativeBounds.top = tp[1];
        this.relativeBounds.right = rp[0];
        this.relativeBounds.bottom = bp[1];
        this.relativeBounds.width = rp[0] - lp[0];
        this.relativeBounds.height = bp[1] - tp[1];
        return this.relativeBounds;
    }

    get absoluteRotate() {
        let rotate = this.rotate;
        let parent = this.parent;
        while (parent != null) {
            rotate += parent.rotate;
            parent = parent.parent;
        }
        return rotate;
    }

    getSelectBounds() {
        return this.getRelativeBounds(this.getGraph());
    }


    /**
     * 仅判断子节点是否在和该figure相交
     * @param child
     * @returns {boolean}
     */
    isOutside(child) {
        this[_selfBounds].right = this.width;
        this[_selfBounds].bottom = this.height;
        let b = child.getRelativeBounds(this);
        return !Tools.overlaps(this[_selfBounds], b);
    }

    moveFigureToTop(figure) {
        if (this.containsChild(figure)) {
            let index1 = this.indexOf(figure);
            let index2 = this.childrenSize - 1;
            this[_children].exchangePosition(index1, index2);
        }
    }

    removeChild(child) {
        if (child == null) return;
        this[_children].remove(child);
        child.parent = null;
        FIGURE_EVENT.name = EVENT_REMOVE_CHILD;
        FIGURE_EVENT.figure = this;
        FIGURE_EVENT.property = {
            oldparent: this,
            currentparent: null,
            child: child
        };
        this.fireEvent(EVENT_REMOVE_CHILD, FIGURE_EVENT);
        return child;
    }
}