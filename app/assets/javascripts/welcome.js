
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
        h: (D.towns.h) / 10,
        m: 10
    };

    var TOWN_NAMES = [
        "Alnwic",
        "Tylwaerdreath",
        "Lhanbryde",
        "Arkaley",
        "Violl's Garden",
        "Leurbost",
        "Kuuma",
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

    Q.Sprite.extend("Ticker", {
        init: function (period, p) {
            this._super(p, {
                clock: 0,
                period: period
            });
        },

        step: function (dt) {
            if ((this.p.clock += dt) < this.p.period) return;

            var population = Q.state.get("population");
            var time       = Q.state.get("time");
            Q.state.set("population", population + 1);
            Q.state.set("time", time + 1);

            this.p.clock = 0;
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
        },

        travel: function (destination) {
            var stage = this.stage;
            var old_towns = this.getCurrentTowns();
            this.p.current_town = destination;

            var new_towns = this.getCurrentTowns();

            /* TODO for now these two lists are always the same
            *  but later they may vary in length */
            for (i = 0; i < old_towns.length; i++) {
                var old_town = old_towns[i];
                var new_town = new_towns[i];

                /* animate the town to slide away */
                old_town.animate({ x: -old_town.p.x, y: old_town.p.y }, { callback: function () {
                    stage.remove(this);
                }});
            }

            /* slide the new towns on stage */
        },

        getCurrentTowns: function () {
            var town = this.p.current_town;
            var neighbours = this.getNeighbours();
            neighbours.unshift(town); // set current_town to the front

            return neighbours;
        },

        focus: function () {
            console.log("wat");
        },

        insertInto: function (stage) {
            stage.insert(this);

            /* give each town UI element some position */
            var town = this.p.current_town;
            var neighbours = this.getNeighbours();
            neighbours.unshift(town); // set current_town to the front

            for (i = 0; i < neighbours.length; i++) {
                town = neighbours[i];
                var offset = (i > 0)? 100 : 20;

                town.p.x = -D.towns.w / 2 + D.town.w / 2 - offset;
                town.p.y = (i * D.town.m) + D.town.h + (i * D.town.h) - D.towns.h / 2;

                town.insertInto(stage, this);
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

        add: function (town) {
            if (this.p.list.isEmpty()) {
                this.p.current_town = town;
            }

            this.p.list.push(town);
        },

        visit: function (e) {
            console.log("visited");
            e.preventDefault();

            this.p.visited = true;
        }
    });

    Q.UI.Button.extend("Town", {
        init: function (population, p) {

            this._super(Q._extend(p || {}, {
                label: "",
                id: Q.state.nextTown(),
                name: Q.state.townName(),
                population: population,
                visited: false,
                fill: "white",
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.town.w,
                h: D.town.h,
            }), this.makePrimary);

            this.p.name_label = new Q.UI.Text({
                label: this.p.name,
                color: "black",
            });

            var w = this.p.name_label.p.w;

            this.p.name_label.p.x = (D.town.w / 2) - w/2 - 30;
            this.add("tween");
        },

        makePrimary: function () {
            console.log("travelling");

            this.container.trigger("travel", this);
        },

        insertInto: function (stage, container) {
            this.p.container = container;

            stage.insert(this, container);
            stage.insert(this.p.name_label, this);
        },

        isVisited: function () {
            return this.p.visited;
        }
    });

    Q.state.townName = function () {
        var index = parseInt((Math.random() * 100) % TOWN_NAMES.length, 10);

        var name = TOWN_NAMES[index];
        TOWN_NAMES.slice(index, 1);

        return name;
    },

    Q.state.nextTown = function () {
        var id = this.p.next_town;
        this.set("next_town", this.p.next_town + 1);

        return id;
    };

    Q.scene("world", function (stage) {
        Q.state.reset({
            next_town: 1
        });

        /* fill the world with a graph of named towns */
        var world = new Q.World();

        /* set up the initial town and adjacencies */
        world.add(new Q.Town(100));
        world.add(new Q.Town(120));
        world.add(new Q.Town(140));

        world.insertInto(stage);
    });

    Q.scene("stats", function(stage) {
        Q.state.reset({
            population: 0,
            time: 0
        });

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

        var population = stage.insert(new Q.UI.Text({
            label: "Population: 1/100",
            color: "white",
            x: (dimensions.w / 3),
            y: 0
        }), stats_container);

        /* update the UI on gamestate changes */
        stage.update_time = function (val) {
            time.p.label = "Day: " + val
        };

        stage.update_population = function (val) {
            population.p.label = "Population: " + val + "/100"
        };

        Q.state.on("change.population", stage.update_population);
        Q.state.on("change.time", stage.update_time);
    });

    //load assets
    Q.load(["signal_tiles.png"], function() {
        Q.stageScene("world", 0);
        Q.stageScene("stats", 1);
    });

});
