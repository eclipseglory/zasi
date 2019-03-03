import "../../libs/tielifa.min.js";
import Tools from "../utils/Tools.js";

const MIN_IMPULSE = 0.00001; // 近似认为冲量为0的最小值
const ITERATE_MAX_TIME = 10; // 速度修正迭代的最大次数
export default class Constraint {
    constructor(p) {
    }

    static solve(figureA, figureB, centerA, centerB, verticesA, verticesB, contactPoints, contactPlanes,
                 n, elastic, friction, depth, slop, beta) {
        // 修正分离法向量，让n和figureA的速度相反：
        let directionNormalize = n;
        let fp = {x: centerB.x - centerA.x, y: centerB.y - centerA.y};
        if (tielifa.Vector2.dot(fp, directionNormalize) > 0) {
            directionNormalize.x *= -1;
            directionNormalize.y *= -1;
        }
        if (slop == undefined)
            slop = 1;
        if (beta == undefined)
            beta = 0.2;
        let bias = Math.max(depth - slop, 0);
        bias *= beta;
        let V = new Array(contactPoints.length);
        // 这里我认为多个接触点分别对原有速度进行约束，得到的结果再合成，但要注意计算冲量的时候质量是平均的，
        // 也就是冲量计算公式的分母要除以接触点数量
        for (let j = 0; j < contactPoints.length; j++) {
            // 把每个碰撞点都有一个横向和纵向冲量和，如果没有，给它重新设定：
            let vertex = contactPoints[j].vertices[contactPoints[j].index];
            let contactPoint = {x: vertex.x, y: vertex.y, normalImpulseSum: 0, tangentImpulseSum: 0};
            let r1p = new tielifa.Vector2(contactPoint.x - centerA.x, contactPoint.y - centerA.y);
            let r2p = new tielifa.Vector2(contactPoint.x - centerB.x, contactPoint.y - centerB.y);
            let v1 = {x: figureA.velocity.x, y: figureA.velocity.y};
            let v2 = {x: figureB.velocity.x, y: figureB.velocity.y};
            let w1 = figureA.angularVelocity;
            let w2 = figureB.angularVelocity;
            // 计算该碰撞点的冲量（横向和纵向）
            // 最大迭代次数为10次，实际上可能大于10次，这里只做近似，每次都修正冲量值
            let totalDeltaV1 = {x: 0, y: 0};
            let totalDeltaV2 = {x: 0, y: 0};
            let totalDeltaW1 = 0;
            let totalDeltaW2 = 0;
            for (let i = 0; i < ITERATE_MAX_TIME; i++) {

                let result = this.computeImpulse(v1, v2, w1, w2,
                    figureA.inverseMass, figureB.inverseMass, figureA.inverseInertia, figureB.inverseInertia, r1p, r2p,
                    n, elastic, friction, bias, contactPoints.length);

                let currentNormalImpulse = result.jn;
                let currentTangentImpulse = result.jt;
                // 这里是根据2006 Erin在GDC上的ppt做的：
                let temp = contactPoint.normalImpulseSum;
                contactPoint.normalImpulseSum = Math.max(contactPoint.normalImpulseSum + currentNormalImpulse, 0);
                currentNormalImpulse = contactPoint.normalImpulseSum - temp;
                temp = contactPoint.tangentImpulseSum;
                contactPoint.tangentImpulseSum = Tools.clamp(contactPoint.tangentImpulseSum + currentTangentImpulse,
                    -1 * contactPoint.normalImpulseSum, contactPoint.normalImpulseSum);
                currentTangentImpulse = contactPoint.tangentImpulseSum - temp;
                // 当前冲量特别小，近似认为是0，那就说明后续修正速度不会再变化了
                if (currentNormalImpulse < MIN_IMPULSE || currentNormalImpulse === 0) {
                    // 摩擦冲量是取决于垂直冲量
                    currentNormalImpulse = 0;
                    currentTangentImpulse = 0;
                    break;
                }
                let t = result.t;
                let tempVector = {x: 0, y: 0};
                let deltaV1 = {x: 0, y: 0};
                let deltaV2 = {x: 0, y: 0};
                let deltaW1 = 0;
                let deltaW2 = 0;
                tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * figureA.inverseMass);
                deltaV1.x += tempVector.x;
                deltaV1.y += tempVector.y;
                tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * figureA.inverseMass);
                deltaV1.x += tempVector.x;
                deltaV1.y += tempVector.y;

                v1.x += deltaV1.x;
                v1.y += deltaV1.y;
                totalDeltaV1.x += deltaV1.x;
                totalDeltaV1.y += deltaV1.y;

                tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * figureB.inverseMass);
                deltaV2.x += tempVector.x;
                deltaV2.y += tempVector.y;
                tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * figureB.inverseMass);
                deltaV2.x += tempVector.x;
                deltaV2.y += tempVector.y;

                v2.x -= deltaV2.x;
                v2.y -= deltaV2.y;
                totalDeltaV2.x += deltaV2.x;
                totalDeltaV2.y += deltaV2.y;

                deltaW1 += tielifa.Vector2.cross(r1p, n) * (figureA.inverseInertia * currentNormalImpulse);
                deltaW1 += tielifa.Vector2.cross(r1p, t) * (figureA.inverseInertia * currentTangentImpulse);
                w1 += deltaW1;
                totalDeltaW1 += deltaW1;

                deltaW2 += tielifa.Vector2.cross(r2p, n) * (figureB.inverseInertia * currentNormalImpulse);
                deltaW2 += tielifa.Vector2.cross(r2p, t) * (figureB.inverseInertia * currentTangentImpulse);
                w2 -= deltaW2;
                totalDeltaW2 += deltaW2;
            }
            V[j] = {v1: totalDeltaV1, v2: totalDeltaV2, w1: totalDeltaW1, w2: totalDeltaW2};
        }
        let deltaV1 = {x: 0, y: 0};
        let deltaV2 = {x: 0, y: 0};
        let deltaW1 = 0;
        let deltaW2 = 0;
        for (let i = 0; i < V.length; i++) {
            let dv = V[i];
            deltaV1.x += dv.v1.x;
            deltaV1.y += dv.v1.y;
            deltaW1 += dv.w1;

            deltaV2.x += dv.v2.x;
            deltaV2.y += dv.v2.y;
            deltaW2 += dv.w2;
        }
        return {v1: deltaV1, v2: deltaV2, w1: deltaW1, w2: deltaW2};
    }

    /**
     * 公式：lambda = -(Jv+b)/JM^-1J^T
     * 找到J，lambda就是冲量
     * @param linearVelocity1
     * @param linearVelocity2
     * @param angularVelocity1
     * @param angularVelocity2
     * @param inverseMass1
     * @param inverseMass2
     * @param inverseInertia1
     * @param inverseInertia2
     * @param r1p
     * @param r2p
     * @param n
     * @param e
     * @param bias
     * @param contactPointsNum
     * @returns {{jn: number, t: {x: number, y: *}, jt: (*|*|*)}}
     */
    static computeImpulse(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
                          inverseMass1, inverseMass2, inverseInertia1, inverseInertia2, r1p, r2p, n, e, friction, bias, contactPointsNum) {

        contactPointsNum = contactPointsNum || 1;
        let t = {x: -n.y, y: n.x};

        let tempVector = {x: 0, y: 0};
        tempVector.x = -angularVelocity1 * r1p.y;
        tempVector.y = angularVelocity1 * r1p.x;

        let x1 = tempVector.x + linearVelocity1.x;
        let y1 = tempVector.y + linearVelocity1.y;

        tempVector.x = -angularVelocity2 * r2p.y;
        tempVector.y = angularVelocity2 * r2p.x;
        tempVector.x = tempVector.x + linearVelocity2.x;
        tempVector.y = tempVector.y + linearVelocity2.y;

        tempVector.x = x1 - tempVector.x;
        tempVector.y = y1 - tempVector.y;

        if (tielifa.Vector2.dot(t, tempVector) < 0) {
            t.x *= -1;
            t.y *= -1;
        }

        // 横向速度大小(标量)
        let tSpeed = tielifa.Vector2.dot(tempVector, t);
        tSpeed *= -1;
        let e1 = -1 - e;
        tempVector.x *= e1;
        tempVector.y *= e1;
        // 接触法向量的速度标量
        let up = tielifa.Vector2.dot(tempVector, n);

        let part1 = 0;
        let part1t = 0;
        if (inverseInertia1 != 0) {
            part1 = tielifa.Vector2.cross(r1p, n);
            part1 = part1 * part1 * inverseInertia1;
            part1t = tielifa.Vector2.cross(r1p, t);
            part1t = part1t * part1t * inverseInertia1;
        }


        let part2 = 0;
        let part2t = 0;
        if (inverseInertia2 != 0) {
            part2 = tielifa.Vector2.cross(r2p, n);
            part2 = part2 * part2 * inverseInertia2;
            part2t = tielifa.Vector2.cross(r2p, t);
            part2t = part2t * part2t * inverseInertia2;
        }
        let inverseMassSum = inverseMass2 + inverseMass1;
        let bottom1 = part1 + part2 + inverseMassSum;
        // 这里因为多个接触点，将质量平均分一下，也就是说冲量公式的分母要乘以接触点个数
        let pn = bottom1 * contactPointsNum;
        let j = up / pn;
        let bottom2 = part1t + part2t + inverseMassSum;
        let pt = bottom2 * contactPointsNum;
        let jt = tSpeed / pt;
        // 允许有负的冲量，放在后面进行叠加冲量
        // j = Math.max(j, 0);
        // 参考2014 GDC Erin说的加入一个bias修正位置错误,真他妈好用~
        j += bias;
        let fn = j * friction;
        jt = Tools.clamp(jt, -1 * fn, fn);
        return {jn: j, jt: jt, t: t};
    }
}