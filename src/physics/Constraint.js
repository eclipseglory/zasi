import Tools from "../utils/Tools.js";

const MIN_IMPULSE = 0.00001; // 近似认为冲量为0的最小值
const ITERATE_MAX_TIME = 10; // 速度修正迭代的最大次数
const TEMP_CONTACT_POINT = {x: Infinity, y: Infinity, normalImpulseSum: 0, tangentImpulseSum: 0};
const TEMP_CONTACT_POINT2 = {x: Infinity, y: Infinity, normalImpulseSum: 0, tangentImpulseSum: 0};
const TEMP_RESULT = {v1: {x: 0, y: 0}, v2: {x: 0, y: 0}, w1: 0, w2: 0, warmTangentImpulse: 0, warmNormalImpulse: 0};
const TEMP_VECTOR2 = {x: 0, y: 0};
const TEMP_RP1 = new tielifa.Vector2(0, 0);
const TEMP_RP2 = new tielifa.Vector2(0, 0);
const TEMP_V1 = {x: 0, y: 0};
const TEMP_V2 = {x: 0, y: 0};
/**
 * 如果你不知道Constraint以及分穿透性约束的推导，你看不懂这个类
 */
export default class Constraint {
    constructor() {
    }

    static solve(figureA, figureB, centerA, centerB, verticesA, verticesB, contactPoints, contactPlanes,
                 n, elastic, friction, depth, slop, beta, warmNormalImpulse, warmTangentImpulse) {
        // 修正分离法向量，让n和figureA的速度相反：
        if (warmNormalImpulse == undefined) warmNormalImpulse = 0;
        if (warmTangentImpulse == undefined) warmTangentImpulse = 0;
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
        let resultVelocity = TEMP_RESULT;

        // 这里我认为多个接触点碰撞就以碰撞点中点为准

        let contact = {
            x: 0,
            y: 0,
            normalImpulseSum: 0,
            tangentImpulseSum: 0,
            affectTangentMass: undefined,
            t: undefined
        };
        for (let i = 0; i < contactPoints.length; i++) {
            let vertex = contactPoints[i].vertices[contactPoints[i].index];
            contact.x += vertex.x;
            contact.y += vertex.y;
        }
        contact.x = contact.x / contactPoints.length;
        contact.y = contact.y / contactPoints.length;
        contact.r1 = {x: contact.x - centerA.x, y: contact.y - centerA.y};
        contact.r2 = {x: contact.x - centerB.x, y: contact.y - centerB.y};

        let totalInverseMass = figureA.inverseMass + figureB.inverseMass;
        let part1 = tielifa.Vector2.cross(contact.r1, n);
        part1 = part1 * part1 * figureA.inverseInertia;
        let part2 = tielifa.Vector2.cross(contact.r2, n);
        part2 = part2 * part2 * figureB.inverseInertia;
        contact.affectNormalMass = part1 + part2 + totalInverseMass;

        let t = {x: -n.y, y: n.x};

        let r1p = contact.r1;
        let r2p = contact.r2;
        let tempVector = TEMP_VECTOR2;
        tempVector.x = tempVector.y = 0;
        tempVector.x = -figureA.angularVelocity * r1p.y;
        tempVector.y = figureA.angularVelocity * r1p.x;

        let x1 = tempVector.x + figureA.velocity.x;
        let y1 = tempVector.y + figureA.velocity.y;

        tempVector.x = -figureB.angularVelocity * r2p.y;
        tempVector.y = figureB.angularVelocity * r2p.x;
        tempVector.x = tempVector.x + figureB.velocity.x;
        tempVector.y = tempVector.y + figureB.velocity.y;

        tempVector.x = x1 - tempVector.x;
        tempVector.y = y1 - tempVector.y;
        if (tielifa.Vector2.dot(t, tempVector) < 0) {
            t.x *= -1;
            t.y *= -1;
        }


        tielifa.Vector2.multiplyValue(tempVector, n, warmNormalImpulse * figureA.inverseMass);
        figureA.velocity.x += tempVector.x;
        figureA.velocity.y += tempVector.y;
        tielifa.Vector2.multiplyValue(tempVector, t, warmTangentImpulse * figureA.inverseMass);
        figureA.velocity.x += tempVector.x;
        figureA.velocity.y += tempVector.y;

        tielifa.Vector2.multiplyValue(tempVector, n, warmNormalImpulse * figureB.inverseMass);
        figureB.velocity.x -= tempVector.x;
        figureB.velocity.y -= tempVector.y;
        tielifa.Vector2.multiplyValue(tempVector, t, warmTangentImpulse * figureB.inverseMass);
        figureB.velocity.x -= tempVector.x;
        figureB.velocity.y -= tempVector.y;
        figureA.angularVelocity += tielifa.Vector2.cross(contact.r1, n) * (figureA.inverseInertia * warmNormalImpulse);
        figureA.angularVelocity += tielifa.Vector2.cross(contact.r1, t) * (figureA.inverseInertia * warmTangentImpulse);
        figureB.angularVelocity -= tielifa.Vector2.cross(contact.r2, n) * (figureB.inverseInertia * warmNormalImpulse);
        figureB.angularVelocity -= tielifa.Vector2.cross(contact.r2, t) * (figureB.inverseInertia * warmTangentImpulse);
        resultVelocity.v1.x = figureA.velocity.x;
        resultVelocity.v1.y = figureA.velocity.y;
        resultVelocity.v2.x = figureB.velocity.x;
        resultVelocity.v2.y = figureB.velocity.y;
        resultVelocity.w1 = figureA.angularVelocity;
        resultVelocity.w2 = figureB.angularVelocity;

        let currentNormalImpulse = 0;
        let currentTangentImpulse = 0;
        for (let i = 0; i < ITERATE_MAX_TIME; i++) {
            let r1p = contact.r1;
            let r2p = contact.r2;

            let result = this.computeImpulse(resultVelocity.v1, resultVelocity.v2, resultVelocity.w1, resultVelocity.w2, contact,
                figureA.inverseMass, figureB.inverseMass, figureA.inverseInertia, figureB.inverseInertia,
                n, elastic, friction, bias, 1);

            currentNormalImpulse = result.jn;
            currentTangentImpulse = result.jt;

            // 这里是根据2006 Erin在GDC上的ppt做的：
            let temp = contact.normalImpulseSum;
            contact.normalImpulseSum = Math.max(contact.normalImpulseSum + currentNormalImpulse, 0);
            currentNormalImpulse = contact.normalImpulseSum - temp;
            //约束不成立，退出
            if (currentNormalImpulse < 0) {
                break;
            }
            temp = contact.tangentImpulseSum;
            contact.tangentImpulseSum = Tools.clamp(contact.tangentImpulseSum + currentTangentImpulse,
                -1 * contact.normalImpulseSum, contact.normalImpulseSum);
            currentTangentImpulse = contact.tangentImpulseSum - temp;
            // 当前冲量特别小，近似认为是0，那就说明后续修正速度不会再变化了
            if (Math.abs(currentNormalImpulse) < MIN_IMPULSE || currentNormalImpulse === 0) {
                break;
            }
            let t = result.t;
            let tempVector = TEMP_VECTOR2;
            tempVector.x = tempVector.y = 0;
            tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * figureA.inverseMass);
            resultVelocity.v1.x += tempVector.x;
            resultVelocity.v1.y += tempVector.y;
            tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * figureA.inverseMass);
            resultVelocity.v1.x += tempVector.x;
            resultVelocity.v1.y += tempVector.y;

            tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * figureB.inverseMass);
            resultVelocity.v2.x -= tempVector.x;
            resultVelocity.v2.y -= tempVector.y;
            tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * figureB.inverseMass);
            resultVelocity.v2.x -= tempVector.x;
            resultVelocity.v2.y -= tempVector.y;
            resultVelocity.w1 += tielifa.Vector2.cross(r1p, n) * (figureA.inverseInertia * currentNormalImpulse);
            resultVelocity.w1 += tielifa.Vector2.cross(r1p, t) * (figureA.inverseInertia * currentTangentImpulse);
            resultVelocity.w2 -= tielifa.Vector2.cross(r2p, n) * (figureB.inverseInertia * currentNormalImpulse);
            resultVelocity.w2 -= tielifa.Vector2.cross(r2p, t) * (figureB.inverseInertia * currentTangentImpulse);
        }
        resultVelocity.warmTangentImpulse = contact.tangentImpulseSum;
        resultVelocity.warmNormalImpulse = contact.normalImpulseSum;
        // resultVelocity.v1.x += v1.x;
        // resultVelocity.v1.y += v1.y;
        // resultVelocity.v2.x += v2.x;
        // resultVelocity.v2.y += v2.y;
        // resultVelocity.w1 += w1;
        // resultVelocity.w2 += w2;
        return resultVelocity;
    }

    static computeImpulse(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2, contact,
                           inverseMass1, inverseMass2, inverseInertia1, inverseInertia2, n, e, friction, bias) {

        let r1p = contact.r1;
        let r2p = contact.r2;
        let tempVector = TEMP_VECTOR2;
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
        let affectNormalMass = contact.affectNormalMass;
        let affectTangentMass = contact.affectTangentMass;
        let t = contact.t;
        if (affectTangentMass == undefined) {
            t = {x: -n.y, y: n.x};
            if (tielifa.Vector2.dot(t, tempVector) < 0) {
                t.x *= -1;
                t.y *= -1;
            }
            contact.t = t;
            let totalInverseMass = inverseMass1 + inverseMass2;
            let part1 = tielifa.Vector2.cross(contact.r1, t);
            part1 = part1 * part1 * inverseInertia1;
            let part2 = tielifa.Vector2.cross(contact.r2, t);
            part2 = part2 * part2 * inverseInertia2;
            contact.affectNormalMass = part1 + part2 + totalInverseMass;
            affectTangentMass = contact.affectNormalMass;
        }


        // 横向速度大小(标量)
        let tSpeed = tielifa.Vector2.dot(tempVector, t);
        tSpeed *= -1;
        let e1 = -1 - e;
        tempVector.x *= e1;
        tempVector.y *= e1;
        // 接触法向量的速度标量
        let up = tielifa.Vector2.dot(tempVector, n);
        // let tSpeed = tielifa.Vector2.dot(tempVector, t);
        let j = up / affectNormalMass;
        let jt = tSpeed / affectTangentMass;
        // 参考2014 GDC Erin说的加入一个bias修正位置错误,真他妈好用~
        j += bias;
        // 允许有负的冲量，放在后面进行叠加冲量
        // j = Math.max(j, 0);
        let fn = j * friction;
        jt = Tools.clamp(jt, -1 * fn, fn);
        return {jn: j, jt: jt, t: t};
    }
}