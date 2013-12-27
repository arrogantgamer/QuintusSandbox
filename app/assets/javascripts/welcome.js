
window.addEventListener("load", function () {
    var CANVAS_WIDTH = 1024;
    var CANVAS_HEIGHT = 768;

    /* global display object */
    var D = {};

    D.bg_color     = "#440077";
    D.label_color = "#DDD";

    D.canvas = {
        w: CANVAS_WIDTH,
        h: CANVAS_HEIGHT
    };

    D.towns = {
        w: (D.canvas.w / 10) * 6 - 20,
        h: (D.canvas.h / 10) * 8,
        m: 20
    };

    D.actions = {
        w: D.canvas.w - D.towns.w - 2 * D.towns.m,
        h: (D.canvas.h / 10) * 8,
        m: 20
    };

    D.action = {
        w: (D.actions.w / 10) * 9,
        h: (D.actions.h) / 6,
        m: 10
    };

    D.town = {
        w: (D.towns.w / 10) * 9,
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
            console.log("tic");
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

    Q.UI.Container.extend("Actions", {
        init: function (p) {
            this._super(p, {
                list: [],
                fill: D.bg_color,
                x: D.towns.m + D.towns.w + D.actions.w / 2,
                y: D.actions.m + D.actions.h / 10 + D.actions.h / 2,
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.actions.w,
                h: D.actions.h
            });

            this.insertInto = Q.debounce(this.insertInto);
        },

        /* return a copy of the array */
        getActions: function () {
            return this.p.list.slice();
        },

        insertInto: function (stage) {
            console.log("setting up:");
            /* find the current towns, and then add labels to
            * enough buttons, and then show those buttons */

            var actions = this.getActions();

            for (var i = 0; i < actions.length; i++) {

                action = actions[i];

                /* set up a button */
                var button = this.children[i];
                action.p.button = button;

                var x = -D.actions.w / 2 + D.action.w / 2 + 20;
                var y = (i * D.action.m) + D.action.h + (i * D.action.h) - D.actions.h / 2;

                /* give the button a back reference */
                button.setAction(action);

                /* insert the button */
                button.p.hidden = false;
                button.animate({ x: x, y: y }, 0.5);
            }

        },

        length: function () {
            return this.p.list.length;
        },

        /* add an action to the menu */
        add: function (action) {
            this.p.list.push(action);

            /* TODO we can't insert 1 button for every town */
            /* but we must have as many towns as the highest degree of any town */
            var button = new Q.ActionButton();
            button.p.hidden = true;
            button.insertInto(this.stage, this);
        }
    });

    Q.UI.Container.extend("World", {
        init: function (p) {
            this._super(p, {
                list: new Q.List(),
                fill: D.bg_color,
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
            Q.state.set("current_town", this.p.current_town);

            for (var i = 0; i < towns.length; i++) {
                var town = towns[i];
                var town_button = town.p.button;
                town.p.button = null;

                /* animate the town to slide away */
                town_button.animate({ x: -(D.towns.w), y: town_button.p.y }, 0.5, {
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
            console.log("setting up:");
            /* find the current towns, and then add labels to
            * enough buttons, and then show those buttons */

            var towns = this.getCurrentTowns();

            for (var i = 0; i < towns.length; i++) {
                town = towns[i];
                console.log(town.p.name);
                var town_button = this.children[i];
                town.p.button = town_button;

                var offset = (i > 0)? 100 : 20;
                var x = -D.towns.w / 2 + D.town.w / 2 - offset;
                var y = (i * D.town.m) + D.town.h + (i * D.town.h) - D.towns.h / 2;
                x = 0;

                town_button.p.hidden = false;
                town_button.setTown(town);
                town_button.animate({ x: x, y: y }, 0.5);
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
                Q.state.set("current_town", this.p.current_town);
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
                cultists: 0,
                population: parseInt(Math.random() * 10, 10) * 1000,
                obscurity: 1,
                investigations: 0
            }));

            this.p.investigation_badge = new Q.Investigation();
            this.p.cult_badge          = new Q.Cult();

            this.on("tic", this.tic);
        },

        isBeingInvestigated: function () {
            return this.p.investigations > Math.pow(this.p.obscurity, 2);
        },

        isCurrent: function () {
            return town.p.name === Q.state.get("current_town").p.name;
        },

        isIndependent: function () {
            return this.p.independent;
        },

        tic: function () {
            this.growCult();
            this.checkInvestigation();
            this.contributeSoulfire();

            /* don't do this stuff for the off-screen towns */
            if (this.p.button) {
                this.updateButton();
            }
        },

        checkInvestigation: function () {
            var rand = Math.random() * 1000;

            if (rand < this.getCultistPercent()) {
                this.p.investigations += 1;
            }
        },

        getCultistPercent: function () {
            return parseInt((this.p.cultists / this.p.population)*100, 10);
        },

        /* this is really what towns are for */
        contributeSoulfire: function () {
            var soulfire = parseInt(this.p.cultists / 10, 10);

            if (this.isBeingInvestigated()) {
                Q.state.addSoulfire(1);
            } else {
                Q.state.addSoulfire(soulfire);
            }
        },

        /* do all the visual stuff */
        updateButton: function () {
            this.p.button.p.demographics_label.p.label = "cultists: " + parseInt(this.p.cultists) + " (" + this.getCultistPercent() + "%)";

            if (!this.p.independent && this.getCultistPercent() === 10) {

                this.p.button.addBadge(this.p.cult_badge);
                this.p.independent = true;
            }

            if (this.isBeingInvestigated()) {
                this.p.button.addBadge(this.p.investigation_badge);
            } else {
                this.p.button.removeBadge(this.p.investigation_badge);
            }
        },

        growCult: function () {
            var p_0 = this.p.cultists;
            var current_town = false;

            /* if you are present, cult population is the max of itself or you */
            if (this.p.name === Q.state.get("current_town").p.name) {
                current_town = true;
                p_0 = Math.max(this.p.cultists, 1);
            }

            /* once a cell has gained momentum, it can grow without you */
            if (!this.isBeingInvestigated() && (current_town || this.p.independent)) {
                this.p.cultists = this.grow(p_0, current_town);
            } else {
                this.p.cultists = this.steady(p_0);
            }
        },

        steady: function (cultists) {
            return cultists;
        },

        grow: function (cultists, current_town) {
            var boost = (current_town)? 1 : 0;
            var growth_factor = 0.5 * (1 / (1 + Math.pow(this.getCultistPercent(), (3 - boost))));

            return (cultists) * (1 + growth_factor);
        }
    });

    Q.Sprite.extend("Badge", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                w: 32,
                h: 32,
                y: -(32) / 2,
                z: 2
            }));
        }

    });

    Q.Badge.extend("Player", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "player.png",
                x: 0 * (64 + 5) - 200
            }));
        }
    });

    Q.Badge.extend("Cult", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "cult.png",
                x: 1 * (64 + 5) - 200,
            }));
        }
    });

    Q.Badge.extend("Investigation", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                asset: "investigation.png",
                x: 2 * (64 + 5) - 200,
            }));
        }

    });

    Q.UI.Button.extend("ActionButton", {
        init: function (p) {
            this._super(Q._extend(p || {}, {
                label: "",
                fill: D.label_color,
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.action.w,
                h: D.action.h,
                z: 0,
                badges: []
            }, this.action));

            this.add("tween");
        },

        setAction: function (action) {
            this.p.action = action;

            this.callback = action.action;
            this.setName(action.p.name);
            this.setCost(action.p.cost);
            this.setDescription(action.p.description);
            this.setIcon(action.p.icon);
        },

        setCost: function (cost) {
            this.addLabel("(" + cost + " Soulfire)", {
                x: (D.action.w / 2) - 94,
                y: 5,
                size: 16
            });
        },

        addLabel: function (label_string, options) {
            if (label_string === undefined) return;

            options = options || {};
            var label_name = label_string + '_label';

            if (this.p[label_name]) {
                this.p[label_name].destroy();
            }

            var label = new Q.UI.Text({
                label: label_string,
                color: "black",
                y: options.y || 0,
                z: 1,
                size: options.size || 24
            });

            var w = label.p.w;
            label.p.x = (options.x - w/2) || (-w/2);

            this.p[label_name] = label;
            this.insert(this.p[label_name]);
        },

        setName: function (name) {
            this.addLabel(name, {
                x: (D.action.w / 2) - 94,
                y: -20,
            });
        },

        setDescription: function (description) {
            this.addLabel(description, {
                x: ((D.action.w / 2) - 94),
                y: 29,
                size: 14
            });
        },

        setIcon: function (icon) {
            if (icon === undefined) return;

            if (this.p.icon_label) {
                this.p.icon_label.destroy();
            }

            this.p.icon_label = new Q.UI.Button({
                asset: icon,
                color: "black",
                size: 16,
                y: 0,
                z: 1
            });

            var w = this.p.icon_label.p.w;

            this.p.icon_label.p.x = (D.action.w / 2) - w/2 - 20;

            this.insert(this.p.icon_label);
        },

        insertInto: function (stage, container) {
            stage.insert(this, container);
        },

    });

    Q.Sprite.extend("Action", {
        init: function (p, callback) {
            this.action = callback;

            this._super(Q._extend(p || {}, {
                cost: p.base_cost
            }));
        }
    });

    Q.UI.Button.extend("TownButton", {
        init: function (p) {

            this._super(Q._extend(p || {}, {
                label: "",
                fill: D.label_color,
                border: 1,
                shadow: 3,
                shadowColor: "rgba(0,0,0,0.5)",
                w: D.town.w,
                h: D.town.h,
                z: 0,
                badges: []
            }), this.travel);

            this.add("tween");
        },

        travel: function () {

            this.container.trigger("travel", this);
        },

        setTown: function (town) {
            this.p.town = town;
            this.setName(town.p.name, town.p.population);
            this.setDemographics({
                cultists: parseInt(town.p.cultists, 10),
                percent: parseInt(town.getCultistPercent())
            });
            this.setBadges(town);
        },

        hasBadge: function (badge) {
            return this.p.badges[badge.className] !== undefined;
        },

        addBadge: function (badge) {
            if (this.hasBadge(badge)) return;

            this.p.badges[badge.className] = badge;
            this.insert(badge);
        },

        removeBadge: function (key) {
            if (key.className) {
                key = key.className;
            }

            var badge = this.p.badges[key];

            if (badge) {
                delete this.p.badges[badge.className];
                this.stage.remove(badge);
            }
        },

        // TODO replace this with a property
        getNumberOfBadges: function () {
            return Object.keys(this.p.badges).length;
        },

        eachBadge: function (callback) {
            var keys = Object.keys(this.p.badges);

            keys.forEach(callback, this);
        },

        setBadges: function (town) {
            if (this.getNumberOfBadges() > 0) {
                this.eachBadge(this.removeBadge);
            }

            if (town.isBeingInvestigated()) {
                this.addBadge(new Q.Investigation());
            }

            if (town.isIndependent()) {
                this.addBadge(new Q.Cult());
            }

            if (town.isCurrent()) {
                var badge = new Q.Player();
                this.addBadge(badge);
            }
        },

        setDemographics: function (demographics) {

            if (this.p.demographics_label) {
                this.stage.remove(this.p.demographics_label);
            }

            /* prepare the number of cultists */
            this.p.demographics_label = new Q.UI.Text({
                label: "cultists: " + demographics.cultists + " (" + demographics.percent + "%)",
                color: "black",
                y: 35,
                z: 1,
                size: 20
            })

            var w = this.p.demographics_label.p.w;

            this.p.demographics_label.p.x = (D.town.w / 2) - w/2 - 30;

            this.insert(this.p.demographics_label);
        },

        setName: function (name, population) {
            if (this.p.name_label || this.p.population_label) {
                this.p.name_label.destroy();
                this.p.population_label.destroy();
            }

            this.p.name_label = new Q.UI.Text({
                label: name,
                color: "black",
                y: -20,
                z: 1
            });

            this.p.population_label = new Q.UI.Text({
                label: "population: " + population,
                color: "black",
                y: 10,
                z: 1,
                size: 20
            });

            var n_w = this.p.name_label.p.w;
            var p_w = this.p.population_label.p.w;

            this.p.name_label.p.x       = (D.town.w / 2) - n_w/2 - 30;
            this.p.population_label.p.x = (D.town.w / 2) - p_w/2 - 30;
            this.insert(this.p.name_label);
            this.insert(this.p.population_label);
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

    Q.scene("actions", function(stage) {
        /* fill the world with a graph of named towns */
        var actions = new Q.Actions();
        stage.insert(actions);

        actions.add(new Q.Action({
            name: "Sacrifice",
            description: "Transforms cultists into soulfire.",
            icon: "sacrifice.png",
            base_cost: 0
        }, function () {
            Q.state.trigger("sacrifice");
        }));

        actions.add(new Q.Action({
            name: "Obscure",
            description: "Shrouds cult activity in mysteries.",
            icon: "obscure.png",
            base_cost: 100
        }, function () {
            Q.state.trigger("obscure");
        }));

        actions.insertInto(stage);
    });

    Q.scene("stats", function(stage) {

        /* an actor that counts seconds */
        stage.insert(new Q.Ticker(1));

        var dimensions = {
            w: CANVAS_WIDTH - 20,
            h: CANVAS_HEIGHT / 10
        };

        var stats_container = stage.insert(new Q.UI.Container({
            fill: D.bg_color,
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
    Q.load(["sacrifice.png", "investigation.png", "cult.png", "player.png", "obscure.png"], function() {
        Q.state.reset({
            soulfire: 0,
            time: 0,
            next_town: 1,
            current_town: { name: "" }
        });

        Q.stageScene("world", 0, { sort: true });
        Q.stageScene("stats", 1);
        Q.stageScene("actions", 2);

    });

});
