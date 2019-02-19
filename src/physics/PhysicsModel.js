/**
 * 包含有边，以及边的法向量，以及模型类型（多边形或圆形）
 */
import GeometryTools from "../geometry/GeometryTools.js";
import "../../libs/tielifa.min.js";
import Tools from "../utils/Tools.js";

const POLYGON_TYPE = 0;
const CIRCLE_TYPE = 1;
const TEMP_VERTEX = [0, 0, 1];
export default class PhysicsModel {
    constructor(p) {
        p = p || {};
        this.type = p['type'] || POLYGON_TYPE;
        this.axis = [];
        this.vertices = null;
        this.center = null;
        this.radiusX = null;
        this.radiusY = null;
        this.originalVertices = [];
        this.originalAxis = [];
        this.originalCenter = null;
        this.center = null;
    }

    static createDefaultModel(figure) {
        let m = new PhysicsModel({type: 0});
        let vertices = [];
        vertices.push({x: 0, y: 0});
        vertices.push({x: figure.width, y: 0});
        vertices.push({x: figure.width, y: figure.height});
        vertices.push({x: 0, y: figure.height});
        m.generateModel(vertices,figure.center);
        return m;
    }

    generateModel(shapeInfor, center) {
        if (shapeInfor instanceof Array) {
            this.type = POLYGON_TYPE;
            this.vertices = shapeInfor;
            GeometryTools.getAxis(this.vertices, this.axis);
            for (let i = 0; i < this.vertices.length; i++) {
                let vertex = this.vertices[i];
                this.originalVertices.push({x: vertex.x, y: vertex.y});
            }
            for (let i = 0; i < this.axis.length; i++) {
                let a = this.axis[i];
                this.originalAxis.push(new tielifa.Vector2(a.x, a.y));
            }
            this.center = {x: center.x, y: center.y};
            this.originalCenter = {x: center.x, y: center.y};
        } else {
            this.type = CIRCLE_TYPE;
            this.center = {x: center.x, y: center.y};
            this.originalCenter = {x: center.x, y: center.y};
            this.radiusX = shapeInfor.radiusX;
            this.radiusY = shapeInfor.radiusY;
        }
    }

    applyCurrentTransform(rotate, matrix) {
        let m = tielifa.Mat3.TEMP_MAT3[0];
        m[0] = matrix[0];
        m[1] = matrix[1];
        m[2] = 0;
        m[3] = matrix[4];
        m[4] = matrix[5];
        m[5] = 0;
        m[6] = matrix[12];
        m[7] = matrix[13];
        m[8] = 1;
        if (!Math.abs(rotate) < 0.0000001) {
            for (let i = 0; i < this.axis.length; i++) {
                let a = this.axis[i];
                let oa = this.originalAxis[i];
                tielifa.Vector2.rotate(a, oa, rotate * Tools.PIDIV180);
            }
        }
        let tempVertex = TEMP_VERTEX;
        for (let i = 0; i < this.originalVertices.length; i++) {
            let vertex = this.originalVertices[i];
            tielifa.Mat3.multiplyWithVertex(tempVertex, m, [vertex.x, vertex.y, 1]);
            this.vertices[i].x = tempVertex[0];
            this.vertices[i].y = tempVertex[1];
        }
        tielifa.Mat3.multiplyWithVertex(tempVertex, m, [this.originalCenter.x, this.originalCenter.y, 1]);
        this.center.x = tempVertex[0];
        this.center.y = tempVertex[1];
    }
}