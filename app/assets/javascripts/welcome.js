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

    //load assets
    Q.load(["sacrifice.png"], function() {
        Q.state.reset({ });

        Q.stageScene("world", 0, { sort: true });
        Q.stageScene("stats", 1);
        Q.stageScene("actions", 2);

    });

});
