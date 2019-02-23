import List from "../src/common/List.js";

const SINGLE_TYPE = 'single';
const H_TYPE = 'h_t';
const V_TYPE = 'v_t';
export default class TextureCreator {
    constructor(p) {
        p = p || {};
        this.resources = p['resources'] || [];
        this.image = [];
        this.width = p['width'] || 1024;
        this.height = p['height'] || 1024;
        this.space = p['space'] || 1;
        this.maxPage = p['maxPage'] || 10;
    }

    loadResources(resources, complete) {
        let loaded = 0;
        let autoid = resources.length;
        let that = this;
        for (let i = 0; i < resources.length; i++) {
            let r = resources[i];
            let image = new Image();
            image.crossOrigin = '';
            if (r.id == undefined) {
                image.id = autoid.toString();
                autoid++;
            } else {
                image.id = r.id;
            }
            image.onload = function (evt) {
                let img = evt.target;
                loaded++;
                that.image.push({
                    id: img.id, img: img
                });
                if (loaded >= resources.length) {
                    if (complete) {
                        complete(that.image);
                    }
                }
            };
            image.onerror = function () {
                loaded++;
                console.warn('读取失败,跳过该资源');
                if (loaded >= resources.length) {
                    if (complete) {
                        complete(that.image);
                    }
                }
            };
            image.src = r.src;
        }
    }

    park() {
        let parkedImage = new List();
        let infos = [];
        let max = this.maxPage;
        let count = 0;
        while (parkedImage.length != this.image.length) {
            let info = this.parkImages(parkedImage);
            if (info.paredInfo.length == 0) break;
            infos.push(info.paredInfo);
            parkedImage = info.parkedImages;
            count++;
            if (count >= max) break;
        }
        let remained = [];
        if (parkedImage.length != this.image.length) {
            for (let i = 0; i < this.image.length; i++) {
                let img = this.image[i];
                if (!parkedImage.contains(img)) {
                    remained.push(img);
                }
            }
        }
        return {parkedInfo: infos, remainImages: remained};
    }

    parkImages(parkedImages) {
        parkedImages = parkedImages || new List();
        let constId = 0;
        let initRegion = {id: constId, width: this.width, height: this.height, x: 0, y: 0, type: SINGLE_TYPE};
        let regions = new List();
        regions.add(initRegion);
        let parkedInformation = [];
        let images = new List();
        for (let i = 0; i < this.image.length; i++) {
            images.add(this.image[i]);
        }
        for (let i = 0; i < images.length; i++) {
            let mostFit = {value: -1, img: null, region: null};
            for (let i = 0; i < regions.length; i++) {
                let region = regions.get(i);
                let fit = this.getFitImage(region, images, parkedImages);
                if (fit.img != null) {
                    if (fit.value > mostFit.value) {
                        mostFit.value = fit.value;
                        mostFit.img = fit.img;
                        mostFit.region = region;
                    }
                }
            }
            if (mostFit.region != null) {
                constId++;
                let img = mostFit.img;
                let re = mostFit.region;
                let parkInfo = {
                    id: img.id,
                    img: img.img,
                    x: re.x,
                    y: re.y,
                    width: img.img.width,
                    height: img.img.height
                };
                parkedInformation.push(parkInfo);
                this.splitRegion(img, constId, re, regions);
                parkedImages.add(img);
            }
        }
        // return parkedInformation;
        return {paredInfo: parkedInformation, parkedImages: parkedImages};
    }

    splitRegion(imageInfo, newRegionId, region, regions) {
        let img = imageInfo.img;
        // 横向分：
        let hRegion1 = {
            id: newRegionId,
            x: img.width + this.space + region.x,
            y: region.y,
            width: region.width - img.width - this.space,
            height: img.height,
            type: H_TYPE
        };
        let hRegion2 = {
            id: newRegionId,
            x: region.x,
            y: region.y + img.height + this.space,
            width: region.width,
            height: region.height - img.height - this.space,
            type: H_TYPE
        };

        //纵向分：
        let vRegion1 = {
            id: newRegionId,
            x: img.width + this.space + region.x,
            y: region.y,
            width: region.width - img.width - this.space,
            height: region.height,
            type: V_TYPE
        };
        let vRegion2 = {
            id: newRegionId,
            x: region.x,
            y: region.y + img.height + this.space,
            width: img.width,
            height: region.height - img.height - this.space,
            type: V_TYPE
        };

        deleteRegion(region.id, region.type);
        regions.remove(region);
        regions.add(hRegion1);
        regions.add(hRegion2);
        regions.add(vRegion1);
        regions.add(vRegion2);

        function deleteRegion(id, type) {
            let deleteType = V_TYPE;
            if (type === V_TYPE) deleteType = H_TYPE;
            //删除以前的横向区域，并把另外一个纵向区域改成独立区域
            let del = [];
            let complete = 0;
            let total = 3;
            for (let i = 0; i < regions.length; i++) {
                let r = regions.get(i);
                if (r == region) continue;
                if (r.id === id) {
                    if (r.type === type) {
                        r.type = SINGLE_TYPE;
                        complete++
                    } else if (r.type === deleteType) {
                        del.push(r);
                        complete++
                    }
                }
                if (complete === total) {
                    break;
                }
            }
            for (let i = 0; i < del.length; i++) {
                regions.remove(del[i]);
            }
        }

    }

    getFitImage(region, images, parkedImages) {
        let fit = {value: -1, img: null};
        for (let i = 0; i < images.length; i++) {
            let image = images.get(i);
            let img = image.img;
            if (parkedImages.contains(image)) continue;
            if (img.width <= region.width && img.height <= region.height) {
                let f = img.width / region.width + img.height / region.height;
                if (f > fit.value) {
                    fit.value = f;
                    fit.img = image;
                }
            }
        }
        return fit;
    }
}