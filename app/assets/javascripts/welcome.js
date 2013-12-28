/* NEXT STEPS */

/*  - add additional events/abilities that are location based
 *  - towns should lose independence if their cult is too small
 *  - re-factor to make things easier
 *  - add things the player can acquire to become more powerful. Like immortality
 *  - add travel time between towns
 *  - add portals between worlds (cliques)
 *  - add a "flash" that displays information like, "Alnwic is under investigation!"
 * */

window.addEventListener("load", function () {
    var CANVAS_WIDTH = 1024;
    var CANVAS_HEIGHT = 768;

    /* global display object */
    var D = {};

    D.canvas = {
        w: 1024,
        h: 768
    };

    D.sprite = {
        w: 64,
        h: 64,
        o: 32
    };

    var Q = Quintus({ imagePath: "/assets/", dataPath: "/assets/", development: true})
    .include("Sprites, Scenes, 2D, Input, UI, Touch, Anim")
    .setup({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    }).controls().touch();

    Q.debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        return function() {
            context = this;
            args = arguments;
            timestamp = new Date();
            var later = function() {
                var last = (new Date()) - timestamp;
                if (last < wait) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) result = func.apply(context, args);
            return result;
        };
    };

    Q.Sprite.extend("Player", {
        init: function (p) {
            this._super(p, {
                sheet: "tiles",
                frame: 2,
                x: 410,
                y: 0

            });

            this.add("2d, runnerControls");
        }
    });

    Q.Sprite.extend("Block", {
        init: function (p) {
            this._super(p, {
                asset: "color_tiles.png",
            });

            this.add("2d");
        },

        step: function (dt) {
            this.p.x -= 1;
        }
    });

    Q.scene("obstacles", function (stage) {
        var tile_layer = new Q.InfiniteTileLayer({
            dataAsset: "level.json",
            sheet: "tiles",
            tileW: 64,
            tileH: 64
        });

        stage.collisionLayer(tile_layer);
        var player = stage.insert(new Q.Player());
        stage.add("viewport").follow(player);
    });

    //load assets
    Q.load(["color_tiles.png", "level.json"], function() {
        Q.state.reset({ });
        Q.sheet("tiles", "color_tiles.png", { tilew: 64, tileh: 64 });

        Q.stageScene("obstacles", 0);

    });

    Q.component("runnerControls", {
        defaults: {
            speed: 400,
            jumpSpeed: -400
        },

        added: function() {
            var p = this.entity.p;

            Q._defaults(p,this.defaults);

            this.entity.on("step",this,"step");
            this.entity.on("bump.bottom",this,"landed");

            p.landed = 0;
            p.direction ='right';
        },

        landed: function(col) {
            var p = this.entity.p;
            p.landed = 1/5;
        },

        step: function(dt) {
            var p = this.entity.p;

            p.direction = 'right';
            p.vx = p.speed;

            if(p.landed > 0 && (Q.inputs['up'] || Q.inputs['action'])) {
                p.vy = p.jumpSpeed;
                p.landed = -dt;
            }
            p.landed -= dt;

        }
    });

    Q.InfiniteTileLayer = Q.Sprite.extend({

        init: function(props) {
            this._super(props,{
                tileW: 32,
                tileH: 32,
                blockTileW: 10,
                blockTileH: 10,
                type: 1,
                renderAlways: true,
                layerIndex: 0
            });
            if(this.p.dataAsset) {
                this.load(this.p.dataAsset);
            }
            this.blocks = [];
            this.p.blockW = this.p.tileW * this.p.blockTileW;
            this.p.blockH = this.p.tileH * this.p.blockTileH;
            this.colBounds = {};
            this.directions = [ 'top','left','right','bottom'];

            this.collisionObject = {
                p: {
                    w: this.p.tileW,
                    h: this.p.tileH,
                    cx: this.p.tileW/2,
                    cy: this.p.tileH/2
                }
            };

            this.collisionNormal = { separate: []};
        },

        load: function(dataAsset) {
            var fileParts = dataAsset.split("."),
            fileExt = fileParts[fileParts.length-1].toLowerCase(),
            data;

            if (fileExt === "json") {
                data = Q._isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;
            }
            else if (fileExt === "tmx" || fileExt === "xml") {
                var parser = new DOMParser(),
                doc = parser.parseFromString(Q.asset(dataAsset), "application/xml");

                var layer = doc.getElementsByTagName("layer")[this.p.layerIndex],
                width = parseInt(layer.getAttribute("width"),10),
                height = parseInt(layer.getAttribute("height"),10);

                var tiles = layer.getElementsByTagName("tile"),
                idx = 0;

                data = [];

                for(var y = 0;y < height;y++) {
                    data[y] = [];
                    for(var x = 0;x < width;x++) {
                        var tile = tiles[idx];
                        data[y].push(parseInt(tile.getAttribute("gid")-1,10));
                        idx++;
                    }
                }
            }
            else {
                throw "file type not supported";
            }
            this.p.tiles = data;
            this.p.rows = data.length;
            this.p.cols = data[0].length;
            this.p.w = this.p.cols * this.p.tileW;
            this.p.h = this.p.rows * this.p.tileH;
        },

        getTile: function(tileX,tileY) {
            return this.p.tiles[tileY] && this.p.tiles[tileY][tileX];
        },

        setTile: function(x,y,tile) {
            var p = this.p,
            blockX = Math.floor(x/p.blockTileW),
            blockY = Math.floor(y/p.blockTileH);

            if(blockX >= 0 && blockY >= 0 &&
               blockX < this.p.cols &&
                   blockY <  this.p.rows) {
                this.p.tiles[y][x] = tile;
            if(this.blocks[blockY]) {
                this.blocks[blockY][blockX] = null;
            }
            }
        },

        tilePresent: function(tileX,tileY) {
            return this.p.tiles[tileY] && this.collidableTile(this.p.tiles[tileY][tileX]);
        },

        // Overload this method to draw tiles at frame 0 or not draw
        // tiles at higher number frames
        drawableTile: function(tileNum) {
            return tileNum > 0;
        },

        // Overload this method to control which tiles trigger a collision
        // (defaults to all tiles > number 0)
        collidableTile: function(tileNum) {
            return tileNum > 0;
        },

        collide: function(obj) {
            var p = this.p,
            tileStartX = Math.floor((obj.p.x - obj.p.cx - p.x) / p.tileW),
            tileStartY = Math.floor((obj.p.y - obj.p.cy - p.y) / p.tileH),
            tileEndX =  Math.ceil((obj.p.x - obj.p.cx + obj.p.w - p.x) / p.tileW),
            tileEndY =  Math.ceil((obj.p.y - obj.p.cy + obj.p.h - p.y) / p.tileH),
            colObj = this.collisionObject,
            normal = this.collisionNormal,
            col;

            normal.collided = false;

            for(var tileY = tileStartY; tileY<=tileEndY; tileY++) {
                for(var tileX = tileStartX; tileX<=tileEndX; tileX++) {
                    if(this.tilePresent(tileX,tileY)) {
                        colObj.p.x = tileX * p.tileW + p.x + p.tileW/2;
                        colObj.p.y = tileY * p.tileH + p.y + p.tileH/2;

                        col = Q.collision(obj,colObj);
                        if(col && col.magnitude > 0 &&
                           (!normal.collided || normal.magnitude < col.magnitude )) {
                            normal.collided = true;
                        normal.separate[0] = col.separate[0];
                        normal.separate[1] = col.separate[1];
                        normal.magnitude = col.magnitude;
                        normal.distance = col.distance;
                        normal.normalX = col.normalX;
                        normal.normalY = col.normalY;
                        normal.tileX = tileX;
                        normal.tileY = tileY;
                        normal.tile = this.getTile(tileX,tileY);
                        }
                    }
                }
            }

            return normal.collided ? normal : false;
        },

        prerenderBlock: function(blockX,blockY) {
            var p = this.p,
            tiles = p.tiles,
            sheet = this.sheet(),
            blockOffsetX = blockX*p.blockTileW,
            blockOffsetY = blockY*p.blockTileH;

            if(blockOffsetX < 0 ||
               blockOffsetY < 0 || blockOffsetY >= this.p.rows) {

                return;
            }

            /* here is where we may do our work */
            /* if we've run out of tiles to show, then we need
            *  to draw more tiles, and maybe remove some old ones */
            if (blockOffsetX >= this.p.cols) {

                var generateInterval = function (x) {
                    var sigma = 2.5, mu = 5,
                        scalar = 1 / Math.sqrt(sigma * Math.PI);

                    var interval = scalar * Math.exp(-(x - mu) / (2 * Math.pow(sigma, 2)));

                    return Math.floor(interval * 10);
                };

                /* add a bunch of 1's to the buttom layer */
                /* add a smattering of 0's and 1's to the top layer */
                var pit = true;
                var new_tiles = 0;
                while (new_tiles < 40) {
                    var pit = !pit;
                    var interval = generateInterval(Math.random() * 10);
                    var height = interval % 2 + 1;
                    var tile = (pit)? 0 : 1;
                    interval = (pit)? interval : interval * 2;

                    for (var i = 0; i < interval; i++) {
                        tiles[2].push(1);

                        // counting from bottom to top
                        for (var j = 0; j < 2; j++) {
                            if (j < height) {
                                tiles[1 - j].push(tile);
                            } else {
                                tiles[1 - j].push(0);
                            }
                        }
                    }

                    new_tiles += interval;
                }

                /* delete tiles that are off stage */
            }

            var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

            canvas.width = p.blockW;
            canvas.height= p.blockH;
            this.blocks[blockY] = this.blocks[blockY] || {};
            this.blocks[blockY][blockX] = canvas;

            for(var y=0;y<p.blockTileH;y++) {
                if(tiles[y+blockOffsetY]) {
                    for(var x=0;x<p.blockTileW;x++) {
                        if(this.drawableTile(tiles[y+blockOffsetY][x+blockOffsetX])) {
                            sheet.draw(ctx,
                                       x*p.tileW,
                                       y*p.tileH,
                                       tiles[y+blockOffsetY][x+blockOffsetX]);
                        }
                    }
                }
            }
        },

        drawBlock: function(ctx, blockX, blockY) {
            var p = this.p,
            startX = Math.floor(blockX * p.blockW + p.x),
            startY = Math.floor(blockY * p.blockH + p.y);

            if(!this.blocks[blockY] || !this.blocks[blockY][blockX]) {
                this.prerenderBlock(blockX,blockY);
            }

            if(this.blocks[blockY]  && this.blocks[blockY][blockX]) {
                ctx.drawImage(this.blocks[blockY][blockX],startX,startY);
            }
        },

        draw: function(ctx) {
            var p = this.p,
            viewport = this.stage.viewport,
            scale = viewport ? viewport.scale : 1,
            x = viewport ? viewport.x : 0,
            y = viewport ? viewport.y : 0,
            viewW = Q.width / scale,
            viewH = Q.height / scale,
            startBlockX = Math.floor((x - p.x) / p.blockW),
            startBlockY = Math.floor((y - p.y) / p.blockH),
            endBlockX = Math.floor((x + viewW - p.x) / p.blockW),
            endBlockY = Math.floor((y + viewH - p.y) / p.blockH);

            for(var iy=startBlockY;iy<=endBlockY;iy++) {
                for(var ix=startBlockX;ix<=endBlockX;ix++) {
                    this.drawBlock(ctx,ix,iy);
                }
            }
        }
    });

});
