
window.addEventListener("load", function () {

    var digest_bitmap = function (bitmap) {

        var sprites = [];

        for(var i = 0; i < bitmap.length; i++) {
            var symbol = bitmap[i],
            klass = Q.legend[symbol],
            x = 90 * (i % 16),
            y = 90 * parseInt(i / 16, 10);

            if (symbol !== ' ') {
                sprites.push(new klass({ x: x + 45, y: y + 45 }));
            }
        }

        return sprites;
    };

    var Q = Quintus({ imagePath: "/assets/", development: true})
    .include("Sprites, Scenes, 2D, Input")
    .setup({
        height: 720,
        width: 1440
    }).controls();

    Q.gravityY = 0;
    Q.gravityX = 0;

    var SPRITE_NONE  = 0;
    var SPRITE_DRONE = 1;
    var SPRITE_BLOCK = 2;

    Q.Sprite.extend("Blank", {
        init: function(p) {
            p.sheet = "signal";
            p.frame = 27;
            p.type = SPRITE_NONE;
            this._super(p);
        }
    });

    Q.Sprite.extend("Block", {
        init: function(p) {
            p.sheet = "signal";
            p.type = SPRITE_BLOCK;
            this._super(p);

            this.on("hit", this.collide);
        },

        collide: function () { }
    });

    Q.Block.extend("Control", {
        init: function (p) {
            p.target = p.colour + "Drone";

            this._super(p);
            this.add("controlRouter");
        }

    });

    Q.Sprite.extend("Drone", {
        init: function(p) {
            this.family = "Drone";
            p.sheet = "signal";
            p.stepDistance = 90;
            p.type = SPRITE_DRONE;
            p.collisionMask = SPRITE_DRONE | SPRITE_BLOCK;
            this._super(p);

            this.on("control", this.control);

            this.add("2d");
            this.add("droneControls");
        },

        /* The drone receives a signal to move */
        control: function (data) {
            this.p.inputs[data] = true;
        }
    });

    /* The grey coloured drones that make
     * up the walls */
    Q.Drone.extend("Null", {
        init: function (p) {
            p.frame = 20;
            this._super(p);

            /* Nulls don't normally move. */
            /* They could though, given this implementation... */
            this.del("2d");
            this.off("control", this.control);
        }
    });

    /* Some normal coloured drones */
    Q.Drone.extend("PinkDrone", {
        init: function (p) {
            p.frame = 23;
            this._super(p);
        }
    });

    /* For some reason, everyone seems to love green drone */
    Q.Drone.extend("GreenDrone", {
        init: function (p) {
            p.frame = 22;
            this._super(p);
        }
    });

    /* The red drone is a problem, we must keep
     * it isolated */
    Q.Drone.extend("RedDrone", {
        init: function (p) {
            p.frame = 21;
            this._super(p);

            /* TODO should probably change this? */
            this.on("hit", this.collide);
        },

        /* the red drone can translate itself through
         * nulls. Fortunately it can be contained. */
        collide: function (collision) {
            var obj = collision.obj;

            if (obj && obj.className === "Null") {
                // swap them
                this.swapping = true;
                this.target = obj;
                this.stage.remove(this);
                this.stage.remove(obj);
            }
        },

        swap: function (stage, obj) {
            var obj_coords = { x: obj.p.x, y: obj.p.y };
            stage.insert(new Q.RedDrone(obj_coords));
            stage.insert(new Q.Null({ x: this.p.x, y: this.p.y }));
            this.destroy();
            obj.destroy();
        },

    });

    Q.legend = {
        '.': Q.Blank,
        'n': Q.Null,
        'r': Q.RedDrone,
        'g': Q.GreenDrone,
        'p': Q.PinkDrone,
        'w': function (p) { return new Q.Control(Q._extend({ frame: 0, direction: "up",    colour: "Green" }, p)); },
        'a': function (p) { return new Q.Control(Q._extend({ frame: 1, direction: "left",  colour: "Green" }, p)); },
        's': function (p) { return new Q.Control(Q._extend({ frame: 2, direction: "down",  colour: "Green" }, p)); },
        'd': function (p) { return new Q.Control(Q._extend({ frame: 3, direction: "right", colour: "Green" }, p)); },
        '8': function (p) { return new Q.Control(Q._extend({ frame: 0, direction: "up",    colour: "Green" }, p)); },
        '4': function (p) { return new Q.Control(Q._extend({ frame: 1, direction: "left",  colour: "Green" }, p)); },
        '2': function (p) { return new Q.Control(Q._extend({ frame: 2, direction: "down",  colour: "Green" }, p)); },
        '6': function (p) { return new Q.Control(Q._extend({ frame: 3, direction: "right", colour: "Green" }, p)); }
    };

    Q.scene("background", function (stage) {
        var tiles = digest_bitmap("\
................\
................\
................\
................\
................\
................\
................\
................\
");

        for(var i = 0; i < tiles.length; i++) {
          stage.insert(tiles[i]);
        }
    });

    Q.scene("level1", function (stage) {
        var tiles = digest_bitmap("\
nnnnnnnnnnnnnnnn\
nnnnnnnnnnnnnnnn\
nnnn       pnnnn\
nnnnn      nnnnn\
nnwnnn   g   nnn\
nardn     nnnnnn\
nnsnnnnnnnnnnnnn\
nnnnnnnnnnnnnnnn\
");

          for(var i = 0; i < tiles.length; i++) {
              stage.insert(tiles[i]);
          }

          /* a stage should know its index */
          stage.p = {};
          stage.p.index = Q.stages.indexOf(stage);
          stage.p.target = "RedDrone";

          /* The stage is the control router for red drones. */
          /* We value internal coherency. */
          stage.add("controlRouter");
          Q.el.addEventListener("keydown", function (e) {
              /* route keydowns to the controlRouter component */
              stage.p.direction = e.key.toLowerCase();

              if (["left", "right", "up", "down"].indexOf(stage.p.direction) > -1) {

                  /* usually there will be only 1 red drone, but this
                   * will also handle the case when there are many. */
                  Q(stage.p.target, stage.p.index).each(function () {
                      stage.trigger("signal", { obj: this });
                  });
              }
          });

          /* TODO not sure what this does? */
          stage.on("removed", function (obj) {
              if (obj.swapping === true) {
                  obj.swap(stage, obj.target);
              }
          });
    });

    Q.load([ "signal_tiles.png"], function() {
        Q.sheet("signal", "signal_tiles.png", { tilew: 90, tileh: 90, sx:0, sy:0 });

        Q.stageScene("background",0);
        Q.stageScene("level1", 1);
    });

    /* Control Router */
    /* The control router receives and responds to keyboard events,
     * just like 'stepControls' in the input module. However, rather
     * than acting on the inputs, the entity in this case responds
     * by broadcasting the inputs to all relevant actors. A selector
     * will be defined on the entity to determine which actors are
     * to be notified. */
    Q.component("controlRouter", {

        added: function () {

            this.entity.on("hit", this, "collision");
            this.entity.on("signal", this, "collision");
        },

        collision: function (col) {
            var p = this.entity.p;
            var scope = (p.index !== undefined)? p.index : Q.activeStage;

            if (col.obj.family === "Drone") {
                Q(p.target, scope).trigger("control", p.direction);
            }
        }
    });

    /* Drone Controls */
    /* This component is pretty much a copy of step controls except
     * that the source of inputs is an object on the entity, rather
     * than Q.inputs. An entity that has added drone controls will
     * respond to keyboard events announced by a control router. */
    Q.component("droneControls", {

        added: function() {
            var p = this.entity.p;
            p.inputs = {};

            if(!p.stepDistance) { p.stepDistance = 32; }
            if(!p.stepDelay) { p.stepDelay = 0.2; }

            p.stepWait = 0;
            this.entity.on("step",this,"step");
        },

        step: function(dt) {
            var p = this.entity.p,
            moved = false;
            p.stepWait -= dt;

            /* mid-step */
            if(p.stepping) {
                p.x += p.diffX * dt / p.stepDelay;
                p.y += p.diffY * dt / p.stepDelay;
            }

            if(p.stepWait > 0) { return; }
            if(p.stepping) {
                p.x = p.destX;
                p.y = p.destY;
            }
            p.stepping = false;

            /* plan a step */
            p.diffX = 0;
            p.diffY = 0;

            if(p.inputs['left']) {
                p.diffX = -p.stepDistance;
            } else if(p.inputs['right']) {
                p.diffX = p.stepDistance;
            }

            if(p.inputs['up']) {
                p.diffY = -p.stepDistance;
            } else if(p.inputs['down']) {
                p.diffY = p.stepDistance;
            }

            // reset the entity's inputs
            this.entity.p.inputs = {};

            if(p.diffY || p.diffX ) {
                p.stepping = true;
                p.origX = p.x;
                p.origY = p.y;
                p.destX = p.x + p.diffX;
                p.destY = p.y + p.diffY;
                p.stepWait = p.stepDelay;
            }

        }

    });
});
