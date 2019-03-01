export default class Map {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.row = 1;
        this.column = 1;
        this.datas = [];
        this.datas[0] = [undefined];
        this.image = undefined;
        this.action = null;
        let that = this;
        this.drawType = 'tile';
        this.currentTextureData = undefined;
        this.physicsModel = undefined;
        this.canvas.oncontextmenu = function (evt) {
            return false;
        };
        this.canvas.addEventListener('mousedown', function (evt) {
            let x = evt.offsetX;
            let y = evt.offsetY;
            if (evt.button == 0) {
                that.action = 'draw'
            }
            if (evt.button == 2) {
                that.action = 'clean'
            }
            that.updateMap(x, y);
        });
        this.canvas.addEventListener('mouseup', function (evt) {
            that.action = null;
        });
        this.canvas.addEventListener('mouseover', function (evt) {
            that.action = null;
        });
        this.canvas.addEventListener('mousemove', function (evt) {
            let x = evt.offsetX;
            let y = evt.offsetY;
            that.updateMap(x, y);
            // that.drawOpacity()
        });
    }

    drawOpacity(x, y) {
        let info = this.datas[index.x][index.y];
        let index = this.getTile(x, y);
        if (this.currentTextureData != undefined) {
            if (info.id == this.currentTextureData.id) {
                return;
            }
            let data = this.currentTextureData;
            let preW = this.canvas.width / this.column;
            let preH = this.canvas.height / this.row;
            this.ctx.globalAlpha = 0.5;
            this.ctx.drawImage(this.image, data.x, data.y, data.width, data.height,
                index.y * preH, index.x * preW, preW, preH);
            this.ctx.globalAlpha = 1;
        }
    }

    updateMap(x, y) {
        if (this.action == null) return;
        let index = this.getTile(x, y);
        let info = this.datas[index.x][index.y];

        if (this.action == 'draw') {
            if (this.drawType == 'tile') {
                if (this.currentTextureData != undefined) {
                    if (info == null) {
                        this.setTileInfo(index.x, index.y, this.currentTextureData);
                    } else if (info.id == this.currentTextureData.id) {
                        return;
                    } else
                        this.setTileInfo(index.x, index.y, this.currentTextureData);
                }
            } else if (this.drawType == 'physics') {
                if (info != null && this.physicsModel != null) {
                    let needUpdate = false;
                    if (info.physicsModel == null || info.physicsModel.length != this.physicsModel.length) {
                        needUpdate = true;
                    } else {
                        let vertices = info.physicsModel.vertices;
                        for (let i = 0; i < vertices.length; i++) {
                            let a = vertices[i];
                            let b = this.physicsModel.vertices[i];
                            if (a.x != b.x || a.y != b.y) {
                                needUpdate = true;
                                break;
                            }
                        }
                    }
                    if (needUpdate) {
                        info.physicsModel = this.physicsModel;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }

        } else if (this.action == 'clean') {
            if (this.drawType == 'tile') {
                if (info == undefined || info == null) {
                    return;
                }
                this.setTileInfo(index.x, index.y, undefined);
            } else if (this.drawType == 'physics') {
                if (info == undefined || info == null) {
                    return;
                }
                if (info.physicsModel == undefined || info.physicsModel == null) {
                    return;
                }
                info.physicsModel = undefined;
            }
        }
        this.update(this.row, this.column);
    }

    resetRowColumn(row, column) {
        this.row = row;
        this.column = column;
    }

    getTile(x, y) {
        let preW = this.canvas.width / this.column;
        let preH = this.canvas.height / this.row;
        let rn = Math.floor(x / preW);
        let cn = Math.floor(y / preH);
        return {x: cn, y: rn};
    }

    setTileInfo(rn, cn, textureInfo) {
        let t = {};
        for (let p in textureInfo) {
            t[p] = textureInfo[p];
        }
        this.datas[rn][cn] = t;
    }


    drawTiles() {
        let preW = this.canvas.width / this.column;
        let preH = this.canvas.height / this.row;
        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.column; j++) {
                let data = this.datas[i][j];
                if (data != undefined && this.image != undefined)
                    this.ctx.drawImage(this.image, data.x, data.y, data.width, data.height,
                        j * preH, i * preW, preW, preH);
            }
        }
    }

    update(row, column, maxSize) {
        this.ctx.strokeStyle = 'red';
        if (this.row != row || this.column != column) {
            this.row = row;
            this.column = column;
            this.canvas.height = this.canvas.width = maxSize;
            if (row > column) {
                this.canvas.height = maxSize;
                this.canvas.width = maxSize / row * column;
            }
            if (column > row) {
                this.canvas.width = maxSize;
                this.canvas.height = maxSize / column * row;
            }
            if (this.datas.length > this.row) {
                let more = this.datas.length - row;
                while (more != 0) {
                    this.datas.pop();
                    more--;
                }
            }
            if (this.datas.length < this.row) {
                let more = row - this.datas.length;
                while (more != 0) {
                    let c = new Array(this.column);
                    this.datas.push(c);
                    more--;
                }
            }
            for (let i = 0; i < this.row; i++) {
                let d = this.datas[i];
                if (d == undefined) {
                    this.datas[i] = new Array(this.column);
                }
                if (d.length > this.column) {
                    let more = d.length - this.column;
                    while (more != 0) {
                        d.pop();
                        more--;
                    }
                }
                if (d.length < this.column) {
                    let more = this.column - d.length;
                    while (more != 0) {
                        d.push(undefined);
                        more--;
                    }
                }
            }
        }


        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        let preW = this.canvas.width / this.column;
        let preH = this.canvas.height / this.row;
        for (let i = 1; i < this.row; i++) {
            this.ctx.moveTo(0, preH * i);
            this.ctx.lineTo(this.canvas.width, preH * i);
        }
        for (let i = 1; i < this.column; i++) {
            this.ctx.moveTo(preW * i, 0);
            this.ctx.lineTo(preW * i, this.canvas.height);
        }
        // this.ctx.stroke();
        this.drawTiles();
        this.drawPhysicsModel();
    }

    drawPhysicsModel() {
        let preW = this.canvas.width / this.column;
        let preH = this.canvas.height / this.row;
        let size = preW;
        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.column; j++) {
                let data = this.datas[i][j];
                if(data == null) continue;
                if (data.physicsModel != null) {
                    let offsetx = j*size;
                    let offsety = i * size;
                    let vertices = data.physicsModel.vertices;
                    this.ctx.translate(offsetx,offsety);
                    this.ctx.beginPath();
                    this.ctx.moveTo(vertices[0].x * size, vertices[0].y * size);
                    for (let k = 1; k < vertices.length; k++) {
                        this.ctx.lineTo(vertices[k].x * size, vertices[k].y * size);
                    }
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.ctx.translate(-offsetx,-offsety);
                }
            }
        }
    }
}