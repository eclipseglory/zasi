export default class TileSelector {
    constructor(canvas) {
        this.canvas = canvas;
        this.startSelect = false;
        this.selectPoint = {x: undefined, y: undefined};
        this.textureData = null;
        this.currentTile = null;
        this.scale = 1;
        this.ctx = null;
        this.texture = null;
    }

    hookCanvas(canvas) {
        let that = this;
        this.canvas = canvas;
        this.canvas.height = this.canvas.width;
        this.ctx = this.canvas.getContext('2d');
        canvas.addEventListener('mouseover', function (evt) {
            that.startSelect = false
        });
        canvas.addEventListener('mousedown', function (evt) {
            that.mouseDown(evt);
        });
        canvas.addEventListener('mouseup', function (evt) {
            that.mouseUp(evt);
        });
        canvas.addEventListener('mousemove', function (evt) {
            that.mouseMove(evt);
        });
    }

    selectTile(x, y) {
        if (this.textureData == null) return;
        x = x / this.scale;
        y = y / this.scale;
        for (let i = 0; i < this.textureData.length; i++) {
            let t = this.textureData[i];
            if (x >= t.x && y >= t.y && x <= t.x + t.width && y <= t.y + t.height) {
                return t;
            }
        }
        return null;
    }

    initCanvas(texture) {
        this.texture = texture;
        let w = this.canvas.width;
        let iw = texture.width;
        let ih = texture.height;
        let h = ih / iw * w;
        if (h > this.canvas.height) {
            h = this.canvas.height;
            w = iw / ih * h;
        }
        this.scale = w / iw;
        this.drawGrid();
    }

    installTextureData(td) {
        this.textureData = td;
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'red';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.texture != null) {
            this.ctx.drawImage(this.texture, 0, 0, this.texture.width * this.scale, this.texture.height * this.scale);
        }
        if (this.textureData != null && this.texture != null) {
            for (let i = 0; i < this.textureData.length; i++) {
                let t = this.textureData[i];
                this.ctx.strokeRect(t.x * this.scale, t.y * this.scale, t.width * this.scale, t.height * this.scale);
                //     if (x >= t.x && y >= t.y && x <= t.x + t.width && y <= t.y + t.height) {
                //         return t;
                //     }
            }
        }
    }

    selectTileCallback(tile) {

    }

    mouseDown(evt) {
        this.startSelect = true;
        this.selectPoint.x = evt.offsetX;
        this.selectPoint.y = evt.offsetY;
        this.currentTile = this.selectTile(evt.offsetX, evt.offsetY);
        this.selectTileCallback(this.currentTile);
    }

    mouseMove(evt) {
        // if (this.startSelect) {
        //     this.selectPoint.x = evt.offsetX;
        //     this.selectPoint.y = evt.offsetY;
        //     this.currentTile = this.selectTile(evt.offsetX, evt.offsetY);
        //     console.log(this.currentTile);
        // }
    }

    mouseUp(evt) {
        this.startSelect = false;
        this.selectPoint.x = undefined;
        this.selectPoint.y = undefined;
    }
}