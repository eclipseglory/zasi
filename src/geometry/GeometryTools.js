import '../../libs/tielifa.min.js';
import Tools from "../utils/Tools.js";

export default class GeometryTools {
    constructor() {
    }

    /**
     * 计算一组顶点的所有法向量轴（为SAT所用）
     * @param vertices
     * @param output
     * @param existAxis
     * @param ignoreSameAxis
     * @returns {Array}
     */
    static getAxis(vertices, output, ignoreSameAxis) {
        let existAxis = [];
        if (ignoreSameAxis == undefined) ignoreSameAxis = true;
        if (output == undefined) {
            output = [];
        }
        for (let i = 0; i < vertices.length; i++) {
            let p1 = vertices[i];
            let p2 = vertices[(i + 1) % vertices.length];
            let axis = new tielifa.Vector2(p2.y - p1.y, p1.x - p2.x);
            let a = Math.atan2(axis.y, axis.x); // 这样计算省去了判断Infinity和-0
            if (ignoreSameAxis) {
                if (sameAxis(existAxis, a)) {
                    // 已经存在相同斜率的轴就跳过
                    continue;
                }
            }
            existAxis.push(a);
            tielifa.Vector2.normalize(axis, axis); // 归一化
            output.push(axis);
        }

        function sameAxis(existAxis, a) {
            for (let i = 0; i < existAxis.length; i++) {
                if (Tools.equals(a, existAxis[i])) {
                    return true;
                }
            }
            return false;
        }

        existAxis = null;
        return output;
    }
}