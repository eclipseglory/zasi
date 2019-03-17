import Tools from "../utils/Tools.js";
import PhysicsModel from "../physics/PhysicsModel.js";

const T_E = 0.001;
/**
 * 如果你不懂什么是分离轴算法，你看不懂这个类
 */
export default class SAT {
    constructor() {
    }

    /**
     * 说是椭圆碰撞测试，其实就是他妈的圆形哦~椭圆还没实现呢~
     * @param modelA
     * @param modelB
     */
    static collisionEllipseTest(modelA, modelB) {
        let collisionResult = {
            collision: false,
            minOverlapFigure: undefined,
            minOverlapAxisIndex: -1,
            MTV: {minOverlap: {value: undefined}, direction: undefined}
        };
        collisionResult.centerA = modelA.center;
        collisionResult.centerB = modelB.center;
        if (modelA.type === PhysicsModel.ELLIPSE_TYPE && modelB.type === PhysicsModel.ELLIPSE_TYPE) {
            // 如果两个都是圆形，比较圆心连线距离和半径和：
            let dis = tielifa.Tools.getDistance(modelA.center, modelB.center);
            let overlap = modelA.radiusX + modelB.radiusX - dis;
            if (overlap > 0) {
                collisionResult.collision = true;
                collisionResult.MTV.direction = new tielifa.Vector2(modelB.center.x - modelA.center.x, modelB.center.y - modelA.center.y);
                tielifa.Vector2.normalize(collisionResult.MTV.direction, collisionResult.MTV.direction);
                collisionResult.MTV.minOverlap.value = overlap;
                collisionResult.contactPoints = [{vertices: [], index: 0}];
                let c = collisionResult.contactPoints[0];
                let temp = tielifa.Vector2.TEMP_VECTORS[0];
                temp.x = -collisionResult.MTV.direction.x;
                temp.y = -collisionResult.MTV.direction.y;
                temp.x *= modelA.radiusX;
                temp.y *= modelA.radiusX;
                c.vertices.push({x: 0, y: 0});
                c.vertices[0].x = modelA.center.x + temp.x;
                c.vertices[0].y = modelA.center.y + temp.y;
                return collisionResult;
            }
        } else {
            let cmodel = modelA;
            let pmodel = modelB;
            if (modelA.type === PhysicsModel.POLYGON_TYPE) {
                pmodel = modelA;
                cmodel = modelB;
            }

            let projectionA = {figure: undefined, min: 0, max: 0, minVertex: undefined, maxVertex: undefined};
            let projectionB = {figure: undefined, min: 0, max: 0, minVertex: undefined, maxVertex: undefined};
            projectionA.figure = pmodel;
            projectionB.figure = cmodel;
            let tempMinOverlap = undefined;
            let sperateNormalOfferFigure = undefined;
            let minOverlapAxisIndex = -1;

            let axes = pmodel.axis;
            for (let i = 0; i < axes.length; i++) {
                let axis = axes[i];
                this.projectionToAxis(projectionA, pmodel.vertices, axis);
                this.circleProjectionToAxis(projectionB, cmodel, axis);
                let minOverlap = this.getMinOverlap(undefined, projectionA, projectionB);
                if (tempMinOverlap == undefined) {
                    tempMinOverlap = minOverlap;
                    sperateNormalOfferFigure = pmodel;
                    minOverlapAxisIndex = i;
                } else {
                    if (minOverlap.value < tempMinOverlap.value) {
                        tempMinOverlap = minOverlap;
                        sperateNormalOfferFigure = pmodel;
                        minOverlapAxisIndex = i;
                    }
                }
                if (tempMinOverlap.value <= 0) {
                    collisionResult.collision = false;
                    return collisionResult;
                }
            }
            let normal = axes[minOverlapAxisIndex];
            collisionResult.collision = true;
            collisionResult.MTV.direction = normal;
            collisionResult.MTV.minOverlap.value = tempMinOverlap.value;

            let points1;
            if (tempMinOverlap.max.figure === pmodel) {
                points1 = this.findPropertyContacatPoints(tempMinOverlap.max.vertex, pmodel.vertices, normal);
                points1.p3 = {index: 0, vertices: [tempMinOverlap.min.vertex]};
            } else {
                points1 = this.findPropertyContacatPoints(tempMinOverlap.min.vertex, pmodel.vertices, normal);
                points1.p3 = {index: 0, vertices: [tempMinOverlap.max.vertex]};
            }


            let contactPoints = [];
            // 四个点钟找到中间那个点
            let maxpoint = points1.p1;
            let minpoint = points1.p1;
            let tempTan = {x: -normal.y, y: normal.x};
            for (let p in points1) {
                let pointInfo = points1[p];
                let maxp = maxpoint.vertices[maxpoint.index];
                let minp = minpoint.vertices[minpoint.index];
                if (pointInfo) {
                    let point = pointInfo.vertices[pointInfo.index];
                    let pm = tielifa.Vector2.dot(maxp, tempTan);
                    let pn = tielifa.Vector2.dot(minp, tempTan);
                    let pp = tielifa.Vector2.dot(point, tempTan);
                    if (pp > pm) {
                        maxpoint = pointInfo;
                    }
                    if (pp < pn) {
                        minpoint = pointInfo;
                    }
                }
            }
            for (let p in points1) {
                let point = points1[p];
                if (point == maxpoint || point == minpoint) {
                    continue;
                }
                if (point != null)
                    contactPoints.push(point);
            }
            collisionResult.p1 = contactPoints[0].vertices[contactPoints[0].index];
            if (contactPoints[0].vertices == pmodel.vertices) {
                contactPoints[0].figure = pmodel;
            } else {
                contactPoints[0].figure = cmodel;
            }
            if (contactPoints.length == 2) {
                collisionResult.p2 = contactPoints[1].vertices[contactPoints[1].index];
                if (contactPoints[1].vertices == pmodel.vertices) {
                    contactPoints[1].figure = pmodel;
                } else {
                    contactPoints[1].figure = cmodel;
                }
            }
            collisionResult.contactPoints = contactPoints;
            return collisionResult;
        }
        return collisionResult;
    }

    static collisionTest(modelA, modelB) {

        if (modelA.type === PhysicsModel.ELLIPSE_TYPE || modelB.type === PhysicsModel.ELLIPSE_TYPE) {
            return this.collisionEllipseTest(modelA, modelB);
        }

        let collisionResult = {
            collision: false,
            minOverlapFigure: undefined,
            minOverlapAxisIndex: -1,
            MTV: {minOverlap: undefined, direction: undefined}
        };
        let v1 = modelA.vertices;
        let v2 = modelB.vertices;
        collisionResult.centerA = modelA.center;
        collisionResult.centerB = modelB.center;
        collisionResult.verticesA = modelA.vertices;
        collisionResult.verticesB = modelB.vertices;

        let axes = modelA.axis;
        let projectionA = {figure: undefined, min: 0, max: 0, minVertex: undefined, maxVertex: undefined};
        let projectionB = {figure: undefined, min: 0, max: 0, minVertex: undefined, maxVertex: undefined};
        projectionA.figure = modelA;
        projectionB.figure = modelB;
        let tempMinOverlap = undefined;
        let sperateNormalOfferFigure = undefined;
        let minOverlapAxisIndex = -1;
        for (let i = 0; i < axes.length; i++) {
            let axis = axes[i];
            this.projectionToAxis(projectionA, v1, axis);
            this.projectionToAxis(projectionB, v2, axis);
            let minOverlap = this.getMinOverlap(undefined, projectionA, projectionB);
            if (tempMinOverlap == undefined) {
                tempMinOverlap = minOverlap;
                sperateNormalOfferFigure = modelA;
                minOverlapAxisIndex = i;
            } else {
                if (minOverlap.value < tempMinOverlap.value) {
                    tempMinOverlap = minOverlap;
                    sperateNormalOfferFigure = modelA;
                    minOverlapAxisIndex = i;
                }
            }
            if (tempMinOverlap.value <= 0) {
                collisionResult.collision = false;
                return collisionResult;
            }
        }
        let axesB = modelB.axis;
        for (let i = 0; i < axesB.length; i++) {
            let axis = axesB[i];
            this.projectionToAxis(projectionA, v1, axis);
            this.projectionToAxis(projectionB, v2, axis);
            let minOverlap = this.getMinOverlap(undefined, projectionA, projectionB);
            if (minOverlap.value < tempMinOverlap.value) {
                tempMinOverlap = minOverlap;
                sperateNormalOfferFigure = modelB;
                minOverlapAxisIndex = i;
            }
            if (tempMinOverlap.value <= 0) {
                collisionResult.collision = false;
                return collisionResult;
            }
        }
        // 这里要注意！！！ 四舍五入是为了避免一个bug，这只是一个hack，最好用其他方法替代
        tempMinOverlap.value = Math.ceil(tempMinOverlap.value * 1000) / 1000;
        collisionResult.collision = true;
        collisionResult.MTV.minOverlap = tempMinOverlap;

        let normal;
        let contactPlane = {p1: undefined, p2: undefined, p3: undefined, p4: undefined};
        if (sperateNormalOfferFigure == modelA) {
            normal = axes[minOverlapAxisIndex];
        } else {
            normal = axesB[minOverlapAxisIndex];
        }

        let points1;
        if (tempMinOverlap.max.figure == modelA) {
            points1 = this.findPropertyContacatPoints(tempMinOverlap.max.vertex, v1, normal);
        } else {
            points1 = this.findPropertyContacatPoints(tempMinOverlap.max.vertex, v2, normal);
        }
        let points2;
        if (tempMinOverlap.min.figure == modelA) {
            points2 = this.findPropertyContacatPoints(tempMinOverlap.min.vertex, v1, normal);
        } else {
            points2 = this.findPropertyContacatPoints(tempMinOverlap.min.vertex, v2, normal);
        }
        points1.p3 = points2.p1;
        points1.p4 = points2.p2;
        if (points1.p2 == undefined) {
            contactPlane.p1 = points1.p3;
            contactPlane.p2 = points1.p4;
        } else {
            contactPlane.p1 = points1.p1;
            contactPlane.p2 = points1.p2;
        }
        if (points2.p4 != undefined) {
            contactPlane.p3 = points1.p3;
            contactPlane.p4 = points1.p4;
        }

        for (let p in contactPlane) {
            let cp = contactPlane[p];
            if (cp == undefined) continue;
            if (cp.vertices == v1) {
                cp.figure = modelA;
            } else {
                cp.figure = modelB;
            }
        }

        let contactPoints = [];
        // 四个点钟找到中间那个点
        let maxpoint = points1.p1;
        let minpoint = points1.p1;
        let tempTan = {x: -normal.y, y: normal.x};
        for (let p in points1) {
            let pointInfo = points1[p];
            let maxp = maxpoint.vertices[maxpoint.index];
            let minp = minpoint.vertices[minpoint.index];
            if (pointInfo) {
                let point = pointInfo.vertices[pointInfo.index];
                let pm = tielifa.Vector2.dot(maxp, tempTan);
                let pn = tielifa.Vector2.dot(minp, tempTan);
                let pp = tielifa.Vector2.dot(point, tempTan);
                if (pp > pm) {
                    maxpoint = pointInfo;
                }
                if (pp < pn) {
                    minpoint = pointInfo;
                }
            }
        }
        for (let p in points1) {
            let point = points1[p];
            if (point == maxpoint || point == minpoint) {
                continue;
            }
            if (point != null)
                contactPoints.push(point);
        }
        collisionResult.p1 = contactPoints[0].vertices[contactPoints[0].index];
        if (contactPoints[0].vertices == v1) {
            contactPoints[0].figure = modelA;
        } else {
            contactPoints[0].figure = modelB;
        }
        if (contactPoints.length == 2) {
            collisionResult.p2 = contactPoints[1].vertices[contactPoints[1].index];
            if (contactPoints[1].vertices == v1) {
                contactPoints[1].figure = modelA;
            } else {
                contactPoints[1].figure = modelB;
            }
        }


        collisionResult.contactPoints = contactPoints;
        collisionResult.MTV.direction = normal;
        collisionResult.minOverlapAxisIndex = minOverlapAxisIndex;
        collisionResult.contactPlane = contactPlane;
        return collisionResult;
    }

    /**
     * 最小overlap对应点临近边最垂直最小分离向量的，如果相互垂直，返回两个点，不垂直，返回输入的那个点
     * @param vertices
     * @param normal
     */
    static findPropertyContacatPoints(vertexIndex, vertices, normal) {
        let p1 = vertices[vertexIndex];
        let preIndex = (vertexIndex - 1 + vertices.length) % vertices.length;
        let nextIndex = (vertexIndex + 1 + vertices.length) % vertices.length;
        let p2 = vertices[preIndex];
        let p3 = vertices[nextIndex];

        let line1 = new tielifa.Vector2(p3.x - p1.x, p3.y - p1.y);
        tielifa.Vector2.normalize(line1, line1);
        let line2 = new tielifa.Vector2(p1.x - p2.x, p1.y - p2.y);
        tielifa.Vector2.normalize(line2, line2);

        let dot1 = Math.abs(tielifa.Vector2.dot(line1, normal));
        let dot2 = Math.abs(tielifa.Vector2.dot(line2, normal));
        if (dot1 >= dot2) {
            if (Tools.equals(dot2, 0) || Math.abs(dot2) <= T_E) {
                return {p1: {index: preIndex, vertices: vertices}, p2: {index: vertexIndex, vertices: vertices}};
            } else {
                return {p1: {index: vertexIndex, vertices: vertices}, p2: null};
            }
        }
        if (dot2 >= dot1) {
            if (Tools.equals(dot1, 0) || Math.abs(dot2) <= T_E) {
                return {p1: {index: vertexIndex, vertices: vertices}, p2: {index: nextIndex, vertices: vertices}};
            } else {
                return {p1: {index: vertexIndex, vertices: vertices}, p2: null};
            }
        }
    }

    static getMinOverlap(out, projectionA, projectionB) {
        if (out == undefined) {
            out = {max: {}, min: {}};
        }
        let a = projectionA.max - projectionB.min;
        let b = projectionB.max - projectionA.min;
        let minOverlap = out;
        if (a < b) {
            minOverlap.value = a;
            minOverlap.max.figure = projectionA.figure;
            minOverlap.max.vertex = projectionA.maxVertex;
            minOverlap.min.figure = projectionB.figure;
            minOverlap.min.vertex = projectionB.minVertex;
        } else {
            minOverlap.value = b;
            minOverlap.max.figure = projectionB.figure;
            minOverlap.max.vertex = projectionB.maxVertex;
            minOverlap.min.figure = projectionA.figure;
            minOverlap.min.vertex = projectionA.minVertex;
        }
        return out;
    }

    static circleProjectionToAxis(out, circle, axis) {
        let temp = tielifa.Vector2.TEMP_VECTORS[0];
        temp.x = axis.x;
        temp.y = axis.y;
        temp.x *= circle.radiusX;
        temp.y *= circle.radiusX;
        let fp = tielifa.Vector2.TEMP_VECTORS[1];
        fp.x = circle.center.x + temp.x;
        fp.y = circle.center.y + temp.y;
        let np = tielifa.Vector2.TEMP_VECTORS[2];
        np.x = circle.center.x - temp.x;
        np.y = circle.center.y - temp.y;

        out.min = tielifa.Vector2.dot(np, axis);
        out.minVertex = {x: np.x, y: np.y};
        out.max = tielifa.Vector2.dot(fp, axis);
        out.maxVertex = {x: fp.x, y: fp.y};
    }


    /**
     * 找出顶点在某轴上的最大和最小投影
     * @param out
     * @param vertices
     * @param axis
     */
    static projectionToAxis(out, vertices, axis) {
        let min = tielifa.Vector2.dot(vertices[0], axis);
        let minVertexIndex = 0;
        let max = min;
        let maxVertexIndex = minVertexIndex;

        for (let i = 1; i < vertices.length; i++) {
            let p = tielifa.Vector2.dot(vertices[i], axis);
            if (p > max) {
                max = p;
                maxVertexIndex = i;
            }
            if (p < min) {
                min = p;
                minVertexIndex = i;
            }
        }
        out.min = min;
        out.minVertex = minVertexIndex;
        out.max = max;
        out.maxVertex = maxVertexIndex;
    }
}
