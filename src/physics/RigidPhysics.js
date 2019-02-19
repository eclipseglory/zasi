import Tools from "../utils/Tools.js";
import '../../libs/tielifa.min.js'

let impulseIterateCount = 100;
let minImpulseValue = 0.00001;
export default class RigidPhysics {

    static get impulseIterateCount() {
        return impulseIterateCount;
    }

    static set impulseIterateCount(c) {
        impulseIterateCount = c;
    }

    static get minImpulseValue() {
        return minImpulseValue;
    }

    static set minImpulseValue(c) {
        minImpulseValue = c;
    }

    /**
     * 根据Catto顺序冲量方法进行迭代处理
     * @param figureA
     * @param figureB
     * @param centerA
     * @param centerB
     * @param verticesA
     * @param verticesB
     * @param contactPoints
     * @param n
     * @param e
     * @param depth
     * @param normalImpulseSum
     * @param tangentImpulseSum
     */
    static solveCollision(figureA, figureB, centerA, centerB, verticesA, verticesB, contactPoints, contactPlanes, n, e, depth) {

        function updateFigureVelocityAndPose(figure, deltaLinearVelocity, deltaAngularVelocity, sign) {
            if (sign == undefined) sign = 1;
            figure.velocity.x += sign * deltaLinearVelocity.x;
            figure.velocity.y += sign * deltaLinearVelocity.y;
            figure.angularVelocity += sign * deltaAngularVelocity;
            if (Tools.equals(figure.velocity.x, 0)) figure.velocity.x = 0;
            if (Tools.equals(figure.velocity.y, 0)) figure.velocity.y = 0;
            // if (Tools.equals(figure.angularVelocity.x, 0)) figure.angularVelocity = 0;
            if (Math.abs(figure.angularVelocity) < 0.0001) figure.angularVelocity = 0;
        }


        // 这个地方要注意，只是单纯将A按照分离方向移动了depth距离，让它处在碰撞临界位置上，实际上这是不正确的计算哦
        let contactPointsArray = this.updateCollisionDirectionAndContacts(figureA, figureB, centerA, centerB, contactPoints, contactPlanes, n, depth);
        let lastImpulse = undefined;
        for (let i = 0; i < impulseIterateCount; i++) {
            let result = this.collisionResponse(figureA.velocity, figureB.velocity, figureA.angularVelocity, figureB.angularVelocity,
                figureA.inverseMass, figureB.inverseMass, figureA.inverseInertia, figureB.inverseInertia,
                centerA, centerB, contactPointsArray, n, e, depth);
            updateFigureVelocityAndPose(figureA, result.v1, result.w1);
            updateFigureVelocityAndPose(figureB, result.v2, result.w2, -1);
            lastImpulse = result.im;
            if (impulseIsZero(lastImpulse)) {
                break;
            }
        }

        function impulseIsZero(impulse) {
            for (let p in impulse) {
                let i = impulse[p];
                if (i == 0 || i < minImpulseValue) {

                } else {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * 基于冲量计算刚体碰撞后各自的速度,其中物体2是参考物体,如果你不知道这个公式，这个方法你看不懂
     * @param linearVelocity1 物体1的线速度
     * @param linearVelocity2 物体2的线速度
     * @param angularVelocity1 物体1的角速度
     * @param angularVelocity2 物体2的角速度
     * @param inverseMass1 物体1质量的倒数
     * @param inverseMass2 物体2质量的倒数
     * @param inverseInertia1 物体1转动惯量的倒数
     * @param inverseInertia2 物体2转动惯量的倒数
     * @param rotatePoint1 物体1的旋转点
     * @param rotatePoint2 物体2的旋转点
     * @param contactPoints 物体的接触点数组，参数可以为单个点对象
     * @param n 分离法向
     * @param e 恢复系数(1-0)
     * @normalImpulseSum 迭代法向冲量和
     * @tangentImpulseSum 迭代横向冲量和
     */
    static collisionResponse(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
                             inverseMass1, inverseMass2, inverseInertia1, inverseInertia2,
                             rotatePoint1, rotatePoint2, contactPoints, n, e, depth) {
        if (e == undefined) e = 1;
        let deltaV1 = {x: 0, y: 0};
        let deltaV2 = {x: 0, y: 0};
        let deltaW1 = 0;
        let deltaW2 = 0;
        let contactNum = 1;
        if (contactPoints instanceof Array) {
            contactNum = contactPoints.length;
        }
        let t = new tielifa.Vector2(n.y, n.x);
        let im = {};
        for (let i = 0; i < contactNum; i++) {
            let contactPoint = contactPoints[i];
            if (contactPoint == undefined) contactPoint = contactPoints;
            let r1p = new tielifa.Vector2(contactPoint.x - rotatePoint1.x, contactPoint.y - rotatePoint1.y);
            let r2p = new tielifa.Vector2(contactPoint.x - rotatePoint2.x, contactPoint.y - rotatePoint2.y);
            let result1 = this.calculateCurrentContactImpulse(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
                inverseMass1, inverseMass2, inverseInertia1, inverseInertia2, r1p, r2p, n, e, contactPoints.length);
            let currentNormalImpulse = result1.jn;
            let currentTangentImpulse = result1.jt;
            if (contactPoint.normalImpulseSum == undefined) contactPoint.normalImpulseSum = 0;
            if (contactPoint.tangentImpulseSum == undefined) contactPoint.tangentImpulseSum = 0;
            let temp = contactPoint.normalImpulseSum;
            contactPoint.normalImpulseSum = Math.max(contactPoint.normalImpulseSum + currentNormalImpulse, 0);
            currentNormalImpulse = contactPoint.normalImpulseSum - temp;
            temp = contactPoint.tangentImpulseSum;
            contactPoint.tangentImpulseSum = Tools.clamp(contactPoint.tangentImpulseSum + currentTangentImpulse,
                -1 * contactPoint.normalImpulseSum, contactPoint.normalImpulseSum);
            currentTangentImpulse = contactPoint.tangentImpulseSum - temp;

            let tempVector = {x: 0, y: 0};
            tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * inverseMass1);
            deltaV1.x = tempVector.x;
            deltaV1.y = tempVector.y;
            tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * inverseMass1);
            deltaV1.x += tempVector.x;
            deltaV1.y += tempVector.y;
            tielifa.Vector2.multiplyValue(tempVector, n, currentNormalImpulse * inverseMass2);
            deltaV2.x = tempVector.x;
            deltaV2.y = tempVector.y;
            tielifa.Vector2.multiplyValue(tempVector, t, currentTangentImpulse * inverseMass2);
            deltaV2.x += tempVector.x;
            deltaV2.y += tempVector.y;

            deltaW1 += tielifa.Vector2.cross(r1p, n) * (inverseInertia1 * currentNormalImpulse);
            deltaW1 += tielifa.Vector2.cross(r1p, t) * (inverseInertia1 * currentTangentImpulse);
            deltaW2 += tielifa.Vector2.cross(r2p, n) * (inverseInertia2 * currentNormalImpulse);
            deltaW2 += tielifa.Vector2.cross(r2p, t) * (inverseInertia2 * currentTangentImpulse);
            let pn = 'impulse' + i;
            im[pn] = currentNormalImpulse;
        }


        return {
            v1: deltaV1,
            v2: deltaV2,
            w1: deltaW1,
            w2: deltaW2,
            im: im
        };
    }

    static calculateCurrentContactImpulse(linearVelocity1, linearVelocity2, angularVelocity1, angularVelocity2,
                                          inverseMass1, inverseMass2, inverseInertia1, inverseInertia2, r1p, r2p, n, e, totalContacts) {
        // 计算接触点的相对速度Vrep , 公式：Vrp = V + WxRrp; 把接触点的角速度换成线速度再和物体线速度相加
        // W x R =  (−W Ry, W Rx, 0)
        // 接触面横向向量：
        let t = new tielifa.Vector2(n.y, n.x);
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
        // let bias = 0.1*3;
        // let vbias = {x:0,y:0};
        // Vector2.multiplyValue(vbias,n,bias);

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
        let pn = bottom1 * totalContacts;
        let j = up / pn;
        let bottom2 = part1t + part2t + inverseMassSum;
        let pt = bottom2 * totalContacts;
        let jt = tSpeed / pt;
        j = Math.max(j, 0);
        let friction = 1;
        let fn = j * friction;
        jt = Tools.clamp(jt, -1 * fn, fn);
        return {jn: j, jt: jt};
    }

    static updateCollisionDirectionAndContacts(figureA, figureB, centerA, centerB, contactPoints, contactPlanes, n, depth) {
        let directionNormalize = n;
        let direction = {x: directionNormalize.x, y: directionNormalize.y};
        let fp = {x: centerB.x - centerA.x, y: centerB.y - centerA.y};
        if (tielifa.Vector2.dot(fp, direction) > 0) {
            direction.x *= -1;
            direction.y *= -1;
            directionNormalize.x *= -1;
            directionNormalize.y *= -1;
        }
        // if (contactPoints[1] != undefined) {
        //     Vector2.multiplyValue(direction, direction, depth);
        // } else {
        //     //以后再算
        //     let contactPlane = {
        //         p1: contactPlanes.p1.vertices[contactPlanes.p1.index],
        //         p2: contactPlanes.p2.vertices[contactPlanes.p2.index],
        //         figure: contactPlanes.p1.figure
        //     };
        //     let deltaTime = 0.1;
        //     let x = centerA.x;
        //     let y = centerA.y;
        //     let deltaRotate = figureA.angularVelocity * deltaTime;
        //     let deltaX = figureA.velocity.x * deltaTime;
        //     let deltaY = figureA.velocity.y * deltaTime;
        //     if (contactPlane.figure == figureB) {
        //         let contactPoint = contactPoints[0].vertices[contactPoints[0].index];
        //         let cx = contactPoint.x;
        //         let cy = contactPoint.y;
        //         let prec = undefined;
        //         let newPoint = undefined;
        //         let pred = 0;
        //         let distance = depth;
        //         let i = 0
        //         for (; i < 10; i++) {
        //             x -= deltaX;
        //             y -= deltaY;
        //             cx -= deltaX;
        //             cy -= deltaY;
        //             newPoint = MurlinMath.calculatePointRotateAbout({x: cx, y: cy},
        //                 {x: x, y: y}, -deltaRotate);
        //             let p = MurlinMath.calculatePointToLine(newPoint, contactPlane.p1, contactPlane.p2);
        //             let v1 = {x: newPoint.x - p.x, y: newPoint.y - p.y};
        //             distance = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        //             if (Vector2.dot(v1, direction) > 0) {
        //                 newPoint = prec;
        //                 distance = pred;
        //                 break;
        //             }
        //             prec = newPoint;
        //             pred = distance;
        //         }
        //         if (newPoint != undefined && distance != undefined) {
        //             distance = Math.ceil(distance * 1000) / 1000;
        //             contactPoint.x = newPoint.x;
        //             contactPoint.y = newPoint.y;
        //             centerA.x -= deltaX * (i + 1);
        //             centerA.y -= deltaY * (i + 1);
        //             figureA.left -= deltaX * (i + 1);
        //             figureA.top -= deltaY * (i + 1);
        //             figureA.rotate -= deltaRotate * (i + 1) * 180 / Math.PI;
        //             Vector2.multiplyValue(direction, direction, distance);
        //         }
        //     } else {
        //         let contactPoint = contactPoints[0].vertices[contactPoints[0].index];
        //         let p1 = contactPlane.p1;
        //         let p2 = contactPlane.p2;
        //         let cx1 = p1.x;
        //         let cy1 = p1.y;
        //         let cx2 = p2.x;
        //         let cy2 = p2.y;
        //         let pred = 0;
        //         let newPoint1 = undefined;
        //         let pnp1 = undefined;
        //         let newPoint2 = undefined;
        //         let pnp2 = undefined;
        //         let distance = depth;
        //         let i = 0
        //         for (; i < 10; i++) {
        //             x -= deltaX;
        //             y -= deltaY;
        //             cx1 -= deltaX;
        //             cy1 -= deltaY;
        //             cx2 -= deltaX;
        //             cy2 -= deltaY;
        //             newPoint1 = MurlinMath.calculatePointRotateAbout({x: cx1, y: cy1},
        //                 {x: x, y: y}, -deltaRotate);
        //             newPoint2 = MurlinMath.calculatePointRotateAbout({x: cx2, y: cy2},
        //                 {x: x, y: y}, -deltaRotate);
        //             let p = MurlinMath.calculatePointToLine(contactPoint, newPoint1, newPoint2);
        //             let v1 = {x: contactPoint.x - p.x, y: contactPoint.y - p.y};
        //             distance = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        //             if (Vector2.dot(v1, direction) > 0) {
        //                 distance = pred;
        //                 newPoint1 = pnp1;
        //                 newPoint2 = pnp2;
        //                 break;
        //             }
        //             pred = distance;
        //             pnp1 = newPoint1;
        //             pnp2 = newPoint2;
        //         }
        //         if (newPoint1 != undefined && distance != undefined && newPoint2 != undefined) {
        //             distance = Math.ceil(distance * 1000) / 1000;
        //             centerA.x -= deltaX * (i + 1);
        //             centerA.y -= deltaY * (i + 1);
        //             figureA.left -= deltaX * (i + 1);
        //             figureA.top -= deltaY * (i + 1);
        //             figureA.rotate -= deltaRotate * (i + 1) * 180 / Math.PI;
        //             n.x = newPoint1.y - newPoint2.y;
        //             n.y = newPoint1.x - newPoint2.x;
        //             Vector2.normalize(n,n);
        //             direction.x = n.x;
        //             direction.y = n.y;
        //             if (Vector2.dot(fp, direction) > 0) {
        //                 direction.x *= -1;
        //                 direction.y *= -1;
        //                 n.x *= -1;
        //                 n.y *= -1;
        //             }
        //
        //             Vector2.multiplyValue(direction, direction, distance);
        //         }
        //     }


        // let van = Vector2.TEMP_VECTORS[0];
        // let contact1 = contactPoints[0].vertices[contactPoints[0].index];
        // let r = {x: contact1.x - centerA.x, y: contact1.y - centerA.y};
        // Vector2.zCrossVector(van, figureA.angularVelocity, r)
        // Vector2.plus(van, van, figureA.velocity);
        // Vector2.normalize(van, van);
        // let cosTheta = Vector2.dot(van, direction);
        // let moveDistance = Math.abs(depth / cosTheta);
        // if (Math.abs(cosTheta) < 0.1) {
        //     //等同于垂直
        //     Vector2.multiplyValue(direction, direction, depth);
        // } else {
        //     if (cosTheta < 0) {
        //         van.x *= -1;
        //         van.y *= -1;
        //     }
        //     Vector2.multiplyValue(van, van, moveDistance);
        //     direction.x = van.x;
        //     direction.y = van.y;
        // }
        // }
        tielifa.Vector2.multiplyValue(direction, direction, depth);
        // figureA参考figureB直接移动插入深度
        figureA.left += direction.x;
        figureA.top += direction.y;
        centerA.x += direction.x;
        centerA.y += direction.y;

        //
        // figureB.left -= direction.x * perB;
        // figureB.top -= direction.y * perB;
        // centerB.x -= direction.x * perB;
        // centerB.y -= direction.y * perB;

        // 接触点如果在分离figureA上，也要加上分离法向量
        let contactPointsArray = [];
        let contactPoint1 = contactPoints[0].vertices[contactPoints[0].index];
        let contactPoint2;
        if (contactPoints[0].figure == figureA.physicsModel) {
            contactPoint1.x += direction.x;
            contactPoint1.y += direction.y;
        }
        contactPointsArray.push(contactPoint1);
        if (contactPoints[1] != undefined) {
            contactPoint2 = contactPoints[1].vertices[contactPoints[1].index];
            contactPointsArray.push(contactPoint2);
            if (contactPoints[1].figure == figureA.physicsModel) {
                contactPoint2.x += direction.x;
                contactPoint2.y += direction.y;
            }
        }
        return contactPointsArray;
    }
}
