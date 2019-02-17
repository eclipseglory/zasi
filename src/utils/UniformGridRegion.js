import List from "../common/List.js";

export default class UniformGridRegion {
    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.relatedFigures = new List();
        this.id = -1;
    }

    addFigure(figure){
        this.relatedFigures.add(figure);
    }

    removeFigure(figure){
        this.relatedFigures.remove(figure);
    }
}