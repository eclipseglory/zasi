export default class PhysicsModel {
    constructor() {
    }

    static createModel(type, row, column, size) {
        let model = {mass: Infinity, momentInertia: Infinity};
        size = size || 1;
        if (type == 'rect') {
            model = {type: type, vertices: []};
            let p1 = {x: 0, y: 0};
            model.vertices.push(p1);
            let p2 = {x: 0, y: size * row};
            model.vertices.push(p2);
            let p3 = {x: size * column, y: size * row};
            model.vertices.push(p3);
            let p4 = {x: size * column, y: 0};
            model.vertices.push(p4);
        } else if (type == 'triangle1') {
            model = {type: type, vertices: []};
            let p1 = {x: 0, y: 0};
            model.vertices.push(p1);
            let p2 = {x: size * column, y: size * row};
            model.vertices.push(p2);
            let p3 = {x: 0, y: size * row};
            model.vertices.push(p3);
        } else if (type == 'triangle2') {
            model = {type: type, vertices: []};
            let p1 = {x: size * column, y: 0};
            model.vertices.push(p1);
            let p2 = {x: size * column, y: size * row};
            model.vertices.push(p2);
            let p3 = {x: 0, y: size * row};
            model.vertices.push(p3);
        }
        return model;
    }
}