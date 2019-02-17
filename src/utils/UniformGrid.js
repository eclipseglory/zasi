import UniformGridRegion from "./UniformGridRegion.js";

export default class UniformGrid {
    constructor(row, column, width, height) {

        let w = Math.floor(width / column);
        if (width % column != 0) { //不是平均分的，就补一个row出来
            column++;
        }
        let h = Math.floor(height / row);
        if (height % row != 0) {
            row++;
        }
        this.row = row;
        this.column = column;

        this.regions = new Array(row);
        for (let i = 0; i < row; i++) {
            this.regions[i] = new Array(column);
        }
        let index = 0;
        for (let i = 0; i < row; i++) {
            let t = i * h;
            let b = t + h;
            for (let j = 0; j < column; j++) {
                let l = j * w;
                let r = l + w;
                let region = new UniformGridRegion(l, t, r, b);
                region.id = index;
                this.regions[i][j] = region;
                index++;
            }
        }
        this.regionWidth = w;
        this.regionHeight = h;

    }

    /**
     * 计算出的索引不一定是合法的
     * @param x
     * @param y
     * @returns {{row: number, column: number}}
     */
    calculateRegionIndex(x, y) {
        let columnIndex = Math.floor(x / this.regionWidth);
        let rowIndex = Math.floor(y / this.regionHeight);
        return {row: rowIndex, column: columnIndex};
    }

    /**
     * 这个方法不一定要计算出正确的Id，有可能是个无效的id
     * @param regionIndex
     * @returns {*}
     */
    calculateRegionId(regionIndex) {
        return regionIndex.row * this.column + regionIndex.column;
    }

    findRegionId(x, y) {
        let regionIndex = this.calculateRegionIndex(x, y);
        return this.getRegionId(regionIndex);
    }

    getRegion(id) {
        let rowIndex = Math.floor(id / this.row);
        let columnIndex = id % this.row;
        if (this.regions[rowIndex] != undefined) {
            return this.regions[rowIndex][columnIndex];
        }
    }

    getRegionId(regionIndex) {
        if (regionIndex.row >= 0 && regionIndex.row < this.row
            && regionIndex.column >= 0 && regionIndex.column < this.column) {
            let region = this.regions[regionIndex.row][regionIndex.column];
            return region.id;
        }
    }

    getRegions(minRegionIndex, maxRegionIndex, output, figure) {
        let ids = output;
        if (ids == undefined) {
            ids = [];
        } else {
            ids.length = 0;
        }
        let ltRowid = minRegionIndex.row;
        let ltColumnid = minRegionIndex.column;
        let rbRowid = maxRegionIndex.row;
        let rbColumnid = maxRegionIndex.column;
        let rowNum = rbRowid - ltRowid + 1;
        let columnNum = rbColumnid - ltColumnid + 1;
        for (let i = 0; i < rowNum; i++) {
            for (let j = 0; j < columnNum; j++) {
                let rId = this.getRegionId({row: i + ltRowid, column: j + ltColumnid});
                if (rId != undefined) {
                    let region = this.getRegion(rId);
                    if (figure != undefined)
                        region.addFigure(figure)
                    ids.push(rId);
                }
            }
        }
        return ids;
    }

    updateRegionsOfFigure(figure) {
        let uniformBounds = figure.getSelectBounds();
        let topLeftRegion = this.calculateRegionIndex(uniformBounds.left, uniformBounds.top);
        let topLeftRegionId = this.calculateRegionId(topLeftRegion);
        let rightBottomRegion = this.calculateRegionIndex(uniformBounds.right, uniformBounds.bottom);
        let rightBottomRegionId = this.calculateRegionId(rightBottomRegion);
        let preRegions = figure.relatedRegions;
        if (preRegions.length != 0) {
            let preTLRegionId = preRegions[0];
            let preRBRegionId = preRegions[preRegions.length - 1];
            if (preTLRegionId == topLeftRegionId && preRBRegionId == rightBottomRegionId) {
                return;// 没有改变就返回
            }
        }
        while (figure.relatedRegions.length != 0) {
            let id = figure.relatedRegions.pop();
            let region = this.getRegion(id);
            region.removeFigure(figure);
        }
        this.getRegions(topLeftRegion, rightBottomRegion, figure.relatedRegions,figure);
    }

    test() {
        console.log(this.regions);
    }
}