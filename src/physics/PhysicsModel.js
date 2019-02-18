/**
 * 包含有边，以及边的法向量，以及模型类型（多边形或圆形）
 */
import GeometryTools from "../geometry/GeometryTools.js";

const POLYGON_TYPE = 0;
const CIRCLE_TYPE = 1;
export default class PhysicsModel {
    constructor(p) {
        this.type = p['type'] || POLYGON_TYPE;
        this.axis = [];
        this.vertices = null;
        this.center = null;
        this.radiusX = null;
        this.radiusY = null;
    }

    generateModel(shapeInfor) {
        if (shapeInfor instanceof Array) {
            this.type = POLYGON_TYPE;
            GeometryTools.getAxis(shapeInfor, this.axis);
            this.vertices = shapeInfor;
        } else {
            this.type = CIRCLE_TYPE;
            this.center = shapeInfor.center;
            this.radiusX = shapeInfor.radiusX;
            this.radiusY = shapeInfor.radiusY;
        }
    }
}