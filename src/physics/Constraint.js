import "../../libs/tielifa.min.js";
import Tools from "../utils/Tools.js";

export default class Constraint {
    constructor(p) {
    }

    static solve(figureA, figureB, centerA, centerB, verticesA, verticesB, contactPoints, contactPlanes, n, e, depth) {
        // 修正分离法向量，让n和figureA的速度相反：
        let directionNormalize = n;
        let fp = {x: centerB.x - centerA.x, y: centerB.y - centerA.y};
        let t = {x: -n.y, y: n.x};
        if (tielifa.Vector2.dot(fp, directionNormalize) > 0) {
            directionNormalize.x *= -1;
            directionNormalize.y *= -1;
        }
        // temp一下figure的速度
        // let v1 = {x: figureA.velocity.x, y: figureA.velocity.y};
        // let v2 = {x: figureB.velocity.x, y: figureB.velocity.y};
        // let w1 = figureA.angularVelocity;
        // let w2 = figureB.angularVelocity;
        let contactsArray = [];

        let V = new Array(contactPoints.length);

        for (let i = 0; i < contactPoints.length; i++) {
            // 把每个碰撞点都有一个横向和纵向冲量和，如果没有，给它重新设定：
            let vertex = contactPoints[i].vertices[contactPoints[i].index];
            let contactPoint = {x: vertex.x, y: vertex.y, normalImpulseSum: 0, tangentImpulseSum: 0};
            let r1p = new tielifa.Vector2(contactPoint.x - centerA.x, contactPoint.y - centerA.y);
            let r2p = new tielifa.Vector2(contactPoint.x - centerB.x, contactPoint.y - centerB.y);
            let v1 = {x: figureA.velocity.x, y: figureA.velocity.y};
            let v2 = {x: figureB.velocity.x, y: figureB.velocity.y};
            let w1 = figureA.angularVelocity;
            let w2 = figureB.angularVelocity;
            // 计算该碰撞点的冲量（横向和纵向）
            // 迭代次数为5次(Erin说他的box2d用5次就能修正)，每次都修正冲量值
            let totalDeltaV1 = {x: 0, y: 0};
            let totalDeltaV2 = {x: 0, y: 0};
            let totalDeltaW1 = 0;
            let totalDeltaW2 = 0;
            for (let i = 0; i < 5; i++) {
                let result = this.process2(v1, v2, w1, w2,
                    figureA.inverseMass, figureB.inverseMass, figureA.inverseInertia, figureB.inverseInertia, r1p, r2p,
                    n, e, 0, 0);

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
                if (currentNormalImpulse == 0) {
                    break;
                }
                let t = {x: -n.y, y: n.x};
                if (tielifa.Vector2.dot(t, v1) < 0) {
                    t.x *= -1;
                    t.y *= -1;
                }
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

                v2.x += deltaV2.x;
                v2.y += deltaV2.y;
                totalDeltaV2.x += deltaV2.x;
                totalDeltaV2.y += deltaV2.y;

                deltaW1 += tielifa.Vector2.cross(r1p, n) * (figureA.inverseInertia * currentNormalImpulse);
                deltaW1 += tielifa.Vector2.cross(r1p, t) * (figureA.inverseInertia * currentTangentImpulse);
                w1 += deltaW1;
                totalDeltaW1 += deltaW1;

                deltaW2 += tielifa.Vector2.cross(r2p, n) * (figureB.inverseInertia * currentNormalImpulse);
                deltaW2 += tielifa.Vector2.cross(r2p, t) * (figureB.inverseInertia * currentTangentImpulse);
                w2 += deltaW2;
                totalDeltaW2 += deltaW2;
            }
            V[i] = {v1: totalDeltaV1, v2: totalDeltaV2, w1: totalDeltaW1, w2: totalDeltaW2};
        }
        let result;
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
        // return V;
    }

    process1(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
             inverseMass1, inverseMass2, inverseInertia1, inverseInertia2,
             rotatePoint1, rotatePoint2, contactPoints, n, e, depth) {

    }


    static process2(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
                    inverseMass1, inverseMass2, inverseInertia1, inverseInertia2, r1p, r2p, n, e, totalContacts, bias) {

        //  记住公式：
        // lambda = -(Jv+b)/JM^-1J^T
        // M^-1是质量导数矩阵，J是雅克比行列式，b是bias(计算方法参考之前基于冲量的那个类)
        // v是速度向量组：[va,wa,vb,wb]
        // 冲量P = J^T lambda
        // V' = V + M^-1 P
        // jacobian = [-n , - r1p x n,n , r2p x n]
        // r x n:
        // v = [v1,w1,v2,w2]
        // 设 JM^-1J^T 为 A :

        // J dot M^-1 :
        // [-n , - r1n,n ,r2n] dot [ 1/m1 , 0,0,0
        //                              0,1/I1,0,0
        //                              0,0,1/m2,0
        //                              0,0,0,1/I2]
        // 所以算出来：
        // part1 =  [-n/m1, -r1n/I1, n/m2, r2n/I2]
        // part1 dot J^T:
        // part2 = -n/m1 dot (-n) + -r1n/I1 dot (-r1n) + n/m2 dot n + r2n/I2 dot r2n
        // 因为n是单位向量 n dot n = 1;
        // r1n dot r1n = [0+0+(r1p.x*n.y - r1p.y*n.x)^2] , r1p.x*n.y - r1p.y*n.x在就是二维向量的叉乘，
        // 所以 r1n dot r1n 在二维中相当于： (rxn)^2 ：
        // A = 1/m1 + 1/m2 + (r1 x n)*(r1 x n )/I1 + (r2 x n)*(r2 x n )/I2
        // 这个就是冲量计算公式的分母啊
        // lambda = -(Jv+b)/JM^-1J^T
        // lambda = - (Jv + b)/A
        // 注意这个Jv ， 即：[-n , - r1p x n,n , r2p x n] dot [v1,w1,v2,w2]，结果就是在撞击点的相对速度
        // 所以最后计算出来的lambda其实就是基于冲量碰撞速度计算中的冲量！！
        let t = new tielifa.Vector2(-n.y, n.x);
        if (tielifa.Vector2.dot(t, linearVelocity1) < 0) {
            t.x *= -1;
            t.y *= -1;
        }
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

        // 横向速度大小(标量)
        let tSpeed = tielifa.Vector2.dot(tempVector, t);
        tSpeed *= -1;
        let e1 = -1 - e;
        tempVector.x *= e1;
        tempVector.y *= e1;
        // 接触法向量的速度标量
        let up = tielifa.Vector2.dot(tempVector, n) + bias;

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
        let pn = bottom1;
        let j = up / pn;
        let bottom2 = part1t + part2t + inverseMassSum;
        let pt = bottom2;
        let jt = tSpeed / pt;
        j = Math.max(j, 0);
        let friction = 1;
        let fn = j * friction;
        jt = Tools.clamp(jt, -1 * fn, fn);
        return {jn: j, jt: jt};

    }
}