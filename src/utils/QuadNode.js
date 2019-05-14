import Tools from "../../../src/utils/Tools.js";

/**
 * 四叉树图形区域索引
 */
export default class QuadNode {
    constructor(x, y, width, height, capacity, maxDepth) {
        this.capacity = capacity;
        if (this.capacity == null) this.capacity = 4;
        this.maxDepth = maxDepth;
        if (this.maxDepth == null) {
            this.maxDepth = 5;
        }
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.ne = null;
        this.nw = null;
        this.se = null;
        this.sw = null;
        this.parent = null;
        this.relateFigures = [];
        this._divide = false;
    }

    get depth() {
        let depth = 0;
        let parent = this.parent;
        while (parent != null) {
            depth++;
            parent = parent.parent;
        }
        return depth;
    }

    get left() {
        return this.x;
    }

    get top() {
        return this.y;
    }

    get right() {
        return this.x + this.width;
    }

    get bottom() {
        return this.y + this.height;
    }

    _addFigureFromChild(quad) {
        for (let i = 0; i < quad.relateFigures.length; i++) {
            let figure = quad.relateFigures[i];
            figure.relatedRegion.remove(quad);
            if (this.relateFigures.indexOf(figure) == -1) {
                this.relateFigures.push(figure);
            }
            if (figure.relatedRegion.contains(this)) {
            } else {
                figure.relatedRegion.add(this);
            }
        }
        quad.relateFigures = [];
    }

    merge() {
        this._divide = false;
        if (this.relateFigures == null)
            this.relateFigures = [];
        this._addFigureFromChild(this.ne);
        this._addFigureFromChild(this.nw);
        this._addFigureFromChild(this.se);
        this._addFigureFromChild(this.sw);
        this.ne = null;
        this.nw = null;
        this.se = null;
        this.sw = null;

    }

    divide() {
        this._divide = true;
        let hW = Math.floor(this.width / 2);
        let hH = Math.floor(this.height / 2);
        if (this.nw == null) {
            this.nw = new QuadNode(this.x, this.y, hW, hH, this.capacity, this.maxDepth);
            this.nw.parent = this;
        }
        if (this.ne == null) {
            this.ne = new QuadNode(this.x + hW, this.y, this.width - hW, hH, this.capacity, this.maxDepth);
            this.ne.parent = this;
        }

        if (this.se == null) {
            this.se = new QuadNode(this.x + hW, this.y + hH, this.width - hW, this.height - hH, this.capacity, this.maxDepth);
            this.se.parent = this;
        }

        if (this.sw == null) {
            this.sw = new QuadNode(this.x, this.y + hH, hW, this.height - hH, this.capacity, this.maxDepth);
            this.sw.parent = this;
        }

        for (let i = 0; i < this.relateFigures.length; i++) {
            let figure = this.relateFigures[i];
            figure.relatedRegion.remove(this);
            this._insertFigureToChildNode(figure);
        }
        this.relateFigures = [];
    }

    _insertFigureToChildNode(figure) {
        return this.ne.insertFigure(figure) ||
            this.nw.insertFigure(figure) ||
            this.se.insertFigure(figure) ||
            this.sw.insertFigure(figure);
    }

    _removeFigureFromChildNode(figure) {
        return this.ne.removeFigure(figure) ||
            this.nw.removeFigure(figure) ||
            this.se.removeFigure(figure) ||
            this.sw.removeFigure(figure);
    }


    // TODO 算法需要改进！
    getChildNodeFigureNum() {
        let temp = [];
        let currentNode = this.nw;
        for (let i = 0; i < currentNode.relateFigures.length; i++) {
            let f = currentNode.relateFigures[i];
            if (temp.indexOf(f) == -1) {
                temp.push(f);
            }
        }
        currentNode = this.ne;
        for (let i = 0; i < currentNode.relateFigures.length; i++) {
            let f = currentNode.relateFigures[i];
            if (temp.indexOf(f) == -1) {
                temp.push(f);
            }
        }
        currentNode = this.se;
        for (let i = 0; i < currentNode.relateFigures.length; i++) {
            let f = currentNode.relateFigures[i];
            if (temp.indexOf(f) == -1) {
                temp.push(f);
            }
        }
        currentNode = this.sw;
        for (let i = 0; i < currentNode.relateFigures.length; i++) {
            let f = currentNode.relateFigures[i];
            if (temp.indexOf(f) == -1) {
                temp.push(f);
            }
        }
        let num = temp.length;
        temp = null;
        return num;
    }

    static updateFigure(root, figure) {
        let tempRegion = [];

        for (let i = 0; i < figure.relatedRegion.length; i++) {
            tempRegion.push(figure.relatedRegion.get(i));
        }
        for (let i = 0; i < tempRegion.length; i++) {
            let quad = tempRegion[i];
            if (!Tools.overlaps(figure, quad)) {
                if (quad.parent != null) {
                    quad = quad.parent;
                }
                quad.removeFigure(figure);
            }
        }
        root.insertFigure(figure);
    }

    removeFigure(figure) {
        if (this._divide) {
            //从子节点中删除后需要检查：如果全是哑元子节点且不重复图形的数量小于了容积量，那么就对该节点进行合并
            let removed = this._removeFigureFromChildNode(figure);
            if (!this.nw._divide && !this.ne._divide && !this.sw._divide && !this.se._divide) {
                let num = this.getChildNodeFigureNum();
                if (num < this.capacity) {
                    this.merge();
                    return removed;
                }
            }
            return removed;
        } else {
            //说明区域没有重合，可以删除
            if (!Tools.overlaps(figure, this) && this.relateFigures.indexOf(figure) != -1) {
                Tools.removeObjFromArray(figure, this.relateFigures);
                figure.relatedRegion.remove(this);
                return true;
            }
        }
        return false;
    }

    insertFigure(figure) {
        //说明区域重合，可以添加
        if (Tools.overlaps(figure, this)) {
            if (this._divide) {
                return this._insertFigureToChildNode(figure);
            } else {
                if (this.relateFigures.indexOf(figure) != -1) return false;
                this.relateFigures.push(figure);
                if (figure.relatedRegion.contains(this)) {
                    return false;
                }
                figure.relatedRegion.add(this);
                if (this.relateFigures.length > this.capacity &&
                    this.depth < this.maxDepth) {
                    this.divide();
                }
                return true;
            }
        } else {
            return false;
        }
    }
}