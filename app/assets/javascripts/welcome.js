
window.addEventListener("load", function () {
    var CANVAS_WIDTH = 1024;
    var CANVAS_HEIGHT = 768;

    /* global dimensions object */
    var D = {};

    D.canvas = {
        w: CANVAS_WIDTH,
        h: CANVAS_HEIGHT
    };

    D.towns = {
        w: D.canvas.w - 20,
        h: (D.canvas.h / 10) * 8,
        m: 20
    };

    D.town = {
        w: (D.towns.w / 10) * 5,
        h: (D.towns.h) / 6,
        m: 10
    };

    var TOWN_NAMES = [
        "Alnwic",
        "Tylwaerdreath",
        "Lhanbryde",
        "Arkaley",
        "Violl's Garden",
        "Leurbost",
        "Loukussa",
        "Skargness",
        "Jedburgh",
        "Auchterarder",
        "Black Hallows",
        "Warthford",
        "Helmfirth",
        "Lanercost",
        "Frostford",
        "Tenby",
        "Leefside",
        "Larnwick",
        "Pran",
        "Addersfield",
        "Quan Ma",
        "Coningsby",
        "Hillford",
        "Garen's Well",
        "Kuuma",
        "Llaneybyder",
        "Bredon",
        "Yarrin",
        "Dungannon",
    ]

    var Q = Quintus({ imagePath: "/assets/", development: true})
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

    Q.Sprite.extend("Ticker", {
        init: function (period, p) {
            this._super(p, {
                clock: 0,
                period: period
            });
        },

        step: function (dt) {
            if ((this.p.clock += dt) < this.p.period) return;

            var soulfire = Q.state.get("soulfire");
            var time       = Q.state.get("time");
            Q.state.set("soulfire", soulfire + 1);
            Q.state.set("time", time + 1);

            this.p.clock = 0;
            Q("World", 0).trigger("tic");
        }

    });

    Q.Sprite.extend("Node", {
        init: function (data, next, prev, p) {
            this._super(p, {
                links: [prev, next],
                data: data
            });
        },

        /* TODO should return a copy */
        getData: function () {
            return this.p.data
        },

        /* TODO should add a copy */
        setData: function (object) {
            this.p.data = object;
        },

        getLink: function (index) {
            return this.p.links[index];
        },

        getNext: function () {
            return this.p.links[1];
        },

        getPrev: function () {
            return this.p.links[0];
        },

        addLink: function (node) {
            this.p.links.push(node);
        },

        setNext: function (node) {
            this.p.links[1] = node;
        },

        setPrev: function (node) {
            this.p.links[0] = node;
        }
    });

    Q.Sprite.extend("List", {
        init: function (p) {
            this._super(p, {
                nodes: [],
                head: null,
                tail: null,
                length: 0
            });
        },

        length: function () {
            return this.p.length;
        },

        isEmpty: function () {
            return this.p.head === null;
        },

        getHead: function () {
            return this.p.head;
        },

        getTail: function () {
            return this.p.tail;
        },

        find: function (object) {
            return this.p.nodes[object.p.id];
        },

        /* pre: object.p.id is unique */
        /* appends to the list */
        push: function (object) {
            var node = new Q.Node(object, null, null);
            this.p.nodes[object.p.id] = node;

            if (this.isEmpty()) {
                node.setNext(node);
                node.setPrev(node);
                this.p.head = node;
                this.p.tail = this.p.head;
            } else {
                this.p.tail.setNext(node);
                this.p.head.setPrev(node);
                node.setPrev(this.p.tail);
                node.setNext(this.p.head);
                this.p.tail = node;
            }

            this.p.length += 1;
            return this;
        },

        pop: function () {
            if (this.isEmpty()) throw "Popped from an empty list";

            var node = this.p.tail;
            this.p.tail = this.p.tail.getPrev();
            this.p.tail.setNext(this.p.head);

            this.p.length -= 1;
            return node.getData();
        }
    });

    Q.UI.Container.extend("World", {
        init: function (p) {
            this._super(p, {
                list: new Q.List(),
                fill: "gray",
                x: D.towns.w / 2,
                y: D.towns.m + D.towns.h / 10 + D.towns.h / 2,
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.towns.w,
                h: D.towns.h
            });

            this.on("travel", this.travel);
            this.on("tic", this.tic);
            this.insertInto = Q.debounce(this.insertInto);
        },

        tic: function () {
            var node = this.p.list.getHead();

            for (var i = 0; i < this.p.list.length(); i++) {
                var town = node.getData();
                town.trigger("tic");
                node = node.getNext();
            }
        },

        travel: function (button) {
            var destination = button.p.town;
            var self = this;
            var towns = this.getCurrentTowns();
            this.p.current_town = destination;
            Q.state.set("current_town", this.p.current_town.p.name);

            for (var i = 0; i < towns.length; i++) {
                var town = towns[i];

                /* animate the town to slide away */
                town.p.button.animate({ x: -(D.towns.w), y: town.p.button.p.y }, 0.5, {
                    callback: function () {
                        /* use a debounced function call to act on all animation being complete */
                        town_button.p.hidden = true;
                        self.insertInto(self.stage);
                    }
                });
            }

        },

        getCurrentTowns: function () {
            var town = this.p.current_town;
            var neighbours = this.getNeighbours();
            neighbours.unshift(town); // set current_town to the front

            return neighbours;
        },

        insertInto: function (stage) {
            /* find the current towns, and then add labels to
            * enough buttons, and then show those buttons */

            var towns = this.getCurrentTowns();

            for (var i = 0; i < towns.length; i++) {
                town = towns[i];
                town_button = this.children[i];
                town.p.button = town_button;

                var offset = (i > 0)? 100 : 20;
                var x = -D.towns.w / 2 + D.town.w / 2 - offset;
                var y = (i * D.town.m) + D.town.h + (i * D.town.h) - D.towns.h / 2;

                town_button.p.hidden = false;
                town_button.animate({ x: x, y: y }, 0.5);
                town_button.setTown(town);
            }
        },

        getNeighbours: function () {
            var node = this.p.list.find(this.p.current_town);

            return [node.getNext().getData(), node.getPrev().getData()];
        },

        getHead: function () {
            return this.p.list.getHead();
        },

        length: function () {
            return this.p.list.length();
        },

        /* add town data to the world */
        add: function (town) {
            if (this.p.list.isEmpty()) {
                this.p.current_town = town;
                Q.state.set("current_town", this.p.current_town.p.name);
            }

            this.p.list.push(town);

            /* TODO we can't insert 1 button for every town */
            /* but we must have as many towns as the highest degree of any town */
            var town_button = new Q.TownButton();
            town_button.p.hidden = true;
            town_button.insertInto(this.stage, this);
        }
    });

    Q.Sprite.extend("Town", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                id: Q.state.nextTown(),
                name: Q.state.townName(),
                visited: false,
                badges: [],
                cultists: 0,
                population: 2000,
                investigation: false
            }));

            this.p.demographics = new Q.UI.Text({
                label: "Cultists: 0 (0%)",
                color: "black",
                y: 20,
                z: 1
            })

            this.on("tic", this.tic);
        },

        tic: function () {

            this.growCult();
            this.checkInvestigation();
            this.contributeSoulfire();
        },

        checkInvestigation: function () {
            var rand = Math.random() * 1000;

            if (rand < this.getCultistPercent()) {
                var badge = new Q.Investigation();
                var length = this.p.badges.length;

                this.p.badges.push(badge);

                badge.p.x = length * 64 + length * 5;
                badge.p.y = -(badge.p.h) / 2;

                this.p.button.addBadge(badge);
                this.p.investigation = true;
            }
        },

        getCultistPercent: function () {
            return parseInt((this.p.cultists / this.p.population)*100, 10);
        },

        /* this is really what towns are for */
        contributeSoulfire: function () {
            var soulfire = parseInt(this.p.cultists / 10, 10);

            if (this.p.investigation) {
                Q.state.addSoulfire(1);
            } else {
                Q.state.addSoulfire(soulfire);
            }
        },

        growCult: function () {
            var p_0 = this.p.cultists;
            var current_town = false;

            /* if you are present, cult population is the max of itself or you */
            if (this.p.name === Q.state.get("current_town")) {
                current_town = true;
                p_0 = Math.max(this.p.cultists, 1);
            }

            /* once a cell has gained momentum, it can grow without you */
            if (!this.p.investigation && (current_town || this.p.independent)) {
                this.p.cultists = this.grow(p_0, current_town);
            } else {
                this.p.cultists = this.steady(p_0);
            }

            this.p.demographics.p.label = "Cultists: " + parseInt(this.p.cultists) + " (" + this.getCultistPercent() + "%)";

            if (!this.p.independent && this.getCultistPercent() === 1) {
                var badge = new Q.Cult();
                var length = this.p.badges.length;

                this.p.badges.push(badge);

                badge.p.x = length * 64 + length * 5;
                badge.p.y = -(badge.p.h) / 2;

                this.p.button.addBadge(badge);
                this.p.independent = true;
            }
        },

        steady: function (cultists) {
            return cultists;
        },

        grow: function (cultists, current_town) {
            var boost = (current_town)? 1 : 0;
            var growth_factor = 0.5 * ((1 + boost) / (1 + Math.pow(this.getCultistPercent(), 2)));

            return (cultists) * (1 + growth_factor);
        }
    });

    Q.Sprite.extend("Badge", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                w: 32,
                h: 32,
                z: 2
            }));
        }

    });

    Q.Badge.extend("Player", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "player.png",
            }));
        }
    });

    Q.Badge.extend("Cult", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "cult.png"
            }));
        }
    });

    Q.Badge.extend("Investigation", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "investigation.png"
            }));
        }

    });

    Q.UI.Button.extend("TownButton", {
        init: function (p) {

            this._super(Q._extend(p || {}, {
                label: "",
                fill: "white",
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.town.w,
                h: D.town.h,
                z: 0
            }), this.travel);

            this.add("tween");
        },

        travel: function () {

            this.container.trigger("travel", this);
        },

        setTown: function (town) {
            this.setName(town.p.name);
            this.setDemographics(town.p.demographics);
            this.p.town = town;

            var badges = town.p.badges;

            if (town.p.name === Q.state.get("current_town")) {
                var length = badges.length;
                var badge = new Q.Player();
                badge.p.x = length * 64 + length * 5;
                badge.p.y = -(badge.p.h) / 2;

                badges.push(badge);
            }

            for (var i = 0; i < badges.length; i++) {
                var badge = badges[i];

                this.addBadge(badge);
            }
        },

        addBadge: function (badge) {
            this.insert(badge);
        },

        setDemographics: function (demographics) {
            if (this.p.demographics_label) {
                this.stage.remove(this.p.demographics_label);
            }

            /* prepare the number of cultists */
            this.p.demographics_label = demographics;

            var w = this.p.demographics_label.p.w;

            this.p.demographics_label.p.x = (D.town.w / 2) - w/2 - 30;

            this.insert(this.p.demographics_label);
        },

        setName: function (name) {
            if (this.p.name_label) {
                this.p.name_label.destroy();
            }

            this.p.name_label = new Q.UI.Text({
                label: name,
                color: "black",
                y: -20,
                z: 1
            });

            var w = this.p.name_label.p.w;

            this.p.name_label.p.x = (D.town.w / 2) - w/2 - 30;
            this.insert(this.p.name_label);
        },

        insertInto: function (stage, container) {
            stage.insert(this, container);
        },

        isVisited: function () {
            return this.p.visited;
        }
    });

    Q.state.addSoulfire = function (soulfire) {
        var current = this.get("soulfire") + soulfire;
        this.set("soulfire", current);
    },

    Q.state.townName = function () {
        var index = parseInt((Math.random() * 100) % TOWN_NAMES.length, 10);

        var name = TOWN_NAMES[index];
        TOWN_NAMES.splice(index, 1);

        return name;
    },

    Q.state.nextTown = function () {
        var id = this.p.next_town;
        this.set("next_town", this.p.next_town + 1);

        return id;
    };

    Q.scene("world", function (stage) {

        /* fill the world with a graph of named towns */
        var world = new Q.World();
        stage.insert(world);

        /* these are place holders */

        /* set up the initial town and adjacencies */
        world.add(new Q.Town());
        world.add(new Q.Town());
        world.add(new Q.Town());
        world.add(new Q.Town());

        world.insertInto(stage);
    });

    Q.scene("stats", function(stage) {

        /* an actor that counts seconds */
        stage.insert(new Q.Ticker(1));

        var dimensions = {
            w: CANVAS_WIDTH - 20,
            h: CANVAS_HEIGHT / 10
        };

        var stats_container = stage.insert(new Q.UI.Container({
            fill: "gray",
            x: dimensions.w / 2,
            y: dimensions.h / 2,
            border: 1,
            shadow: 3,
            shadowColor: "rgba(0,0,0,0.5)",
            w: dimensions.w,
            h: dimensions.h
        }));

        var time = stage.insert(new Q.UI.Text({
            label: "Day: 0",
            color: "white",
            x: -(dimensions.w / 3),
            y: 0
        }), stats_container);

        var soulfire = stage.insert(new Q.UI.Text({
            label: "Soulfire: 1",
            color: "white",
            x: (dimensions.w / 3),
            y: 0
        }), stats_container);

        /* update the UI on gamestate changes */
        stage.update_time = function (val) {
            time.p.label = "Day: " + val
        };

        stage.update_soulfire = function (val) {
            soulfire.p.label = "Soulfire: " + val
        };

        Q.state.on("change.soulfire", stage.update_soulfire);
        Q.state.on("change.time", stage.update_time);
    });

    //load assets
    Q.load(["investigation.png", "cult.png", "player.png", "obscure.png"], function() {
        Q.state.reset({
            soulfire: 0,
            time: 0,
            next_town: 1,
            current_town: ""
        });

        Q.stageScene("world", 0, { sort: true });
        Q.stageScene("stats", 1);

    });

});
