var nav = {
    // Object containing the navigation states of all the active contexts in the app
    contexts: {},
    contextsLast: {},

    // Equivalent to nav.contexts.app and nav.contextsLast.app
    current: [],
    last: [],

    timeouts: [],

    contextEls: {},
    contextTimeouts: {},

    currentOnElems: {},

    contextViews: {},
    contextListeners: {},

    //if we want a child view to be open as soon as we open a view
    findAutos: function(elems, views, context) {
        var auto_view = "";
        //if there are many elements with the view and data-auto-view, need to pick one.
        elems.each(function() {
            var my_auto = $(this).data("auto-view");

            //warn if we've specific conflicting auto-views for this view somewhere in the DOM
            if (auto_view && auto_view != my_auto) {
                console.error("conflicting auto-views: " + auto_view + " " + my_auto + " : using " + my_auto)
            }
            auto_view = my_auto;
        })

        //if we found an auto-view, add to the list of places we need to go.
        if (auto_view) {
            views.push(auto_view);

            //do we have children, within our view, that also have autos?
            var view_class = "[data-view~=" + auto_view + "][data-auto-view]";
            var autos = elems.find(view_class).not(elems.find("[data-view]").find(view_class));

            //if we found anything, look at their autos
            if (autos.length) {
                nav.findAutos(autos, views, context)
            }
        }
    },

    findElementsInViews: function(views) {
        var selector = "";
        for (var i = 0; i < views.length; i++) {
            for (var j = 0; j <= i; j++) {
                selector += "[data-view~='" + views[j] + "'] ";
            };
            selector = selector.slice(0, -1);
            selector += ", ";
        };

        selector = selector.slice(0, -2);
        return $(selector);
    },

    getContexts: function () {
        $("#body").data("nav-context", "app");

    	$("[data-nav-context]").each(function(index, el) {
    		var contextName = $(el).data("nav-context");
    		nav.contextEls[contextName] = $(el);
            nav.contextViews[contextName] = $("");
            nav.contextListeners[contextName] = $("");
    		nav.currentOnElems[contextName] = $("");
    	});

        $("[data-view]").each(function(index, el) {
            var contextName = $(el).closest("[data-nav-context]").data("nav-context");
            nav.contextViews[contextName].push(el);
        });

        $("[data-track-view-show], .track-view").each(function(index, el) {
            var contextName;
            if ($(el).data("track-context") !== undefined) {
                contextName = $(el).data("track-context");
            } else {
                contextName = $(el).closest("[data-nav-context]").data("nav-context");
            }
            nav.contextListeners[contextName].push(el);
        });
    },

    findElementsInContext: function (views, context) {
    	var selector = "";
    	if (views !== undefined) {
	        for (var i = 0; i < views.length; i++) {
	            for (var j = 0; j <= i; j++) {
	                selector += "[data-view~='" + views[j] + "'] ";
	            };
	            selector = selector.slice(0, -1);
	            selector += ", ";
	        };

	        selector = selector.slice(0, -2);
    	}
        return nav.contextViews[context].filter(selector);
    },

    activateContext: function (contextName) {
        if (nav.contexts[contextName] === undefined) {
            clearTimeout(nav.contextTimeouts[contextName]);
            nav.contexts[contextName] = [];
            nav.contextEls[contextName].addClass("draw");
        }
    },

    closeContext: function (contextName) {
        if (nav.contexts[contextName]) {
            nav.go(["__context_close__"], contextName);
            delete nav.contexts[contextName]
            nav.contextTimeouts[contextName] = setTimeout(function(){
                nav.contextEls[contextName].removeClass("draw");
            }, 2000)

            if (typeof on_close_context === "function") {
                on_close_context(contextName);
            }
        }
    },

    go: function (views, context) {
        if (context === undefined) {
            context = "app";
        }

    	var contextEl = nav.contextEls[context];

    	if (views !== undefined) {
	    	if (typeof views !== "object") {
	            if (views.match(",")) {
	                views = views.split(",");
	            } else {
	                views = views.split(" ");
	            }
	        }
    	}

        // Find any "auto-views" at the end of the view array, add them to the view array
        if (views !== undefined) {
            nav.findAutos($("[data-view~='" + views.join("'] [data-view~='") + "'][data-auto-view]"), views, context);
        }

        if (typeof before_nav_go === "function") {
            if (before_nav_go(views, context) === false) {
                return;
            }
        }

        nav.activateContext(context);

        if (nav.contexts[context] !== undefined) {
        	nav.contextsLast[context] = nav.contexts[context].slice(0);
        } else {
        	nav.contextsLast[context] = [];
        }
        nav.contexts[context] = views;

        // No hybrid approach necessary
        if (context === "app") {
            nav.current = nav.contexts["app"].slice(0);
            nav.last = nav.contextsLast["app"].slice(0);
        }


        // activeElems contains all of the elements that are currently on based on the current views
        var currentActiveElems = nav.findElementsInContext(views, context);
        var activeElems = currentActiveElems;

        // onElems contains the view elements that are newly turned on
        var onElems = activeElems.not(nav.currentOnElems[context]);

        // offElems contains the view elements that are about to be turned off
        var offElems = nav.currentOnElems[context].not(activeElems);

        var tracking_path = nav.contextListeners[context].filter(":not([data-track-level])");
        var tracking_level = nav.contextListeners[context].filter("[data-track-level]");

        var old_level_path = nav.contextsLast[context].join(" ");

        var new_level_path = "";
        if (views !== undefined) {
        	new_level_path = nav.contexts[context].join(" ");
        }

        var timestamp = performance.now();
        var removalObj = {
            tstamp: timestamp,
            elemCollection: offElems,
        }
        nav.timeouts.push(removalObj);

        for (var i = 0; i < nav.timeouts.length; i++) {
            nav.timeouts[i].elemCollection = nav.timeouts[i].elemCollection.not(activeElems);
        };

        setTimeout(function() {
            for (var i = nav.timeouts.length - 1; i >= 0; i--) {
                if (this[0] === nav.timeouts[i].tstamp) {
                    $(nav.timeouts[i].elemCollection).removeClass("draw").removeClass("draw-heavy").removeClass("transition-out").data("to", "").data("from", "");
                    nav.timeouts.splice(i, 1);
                    break;
                }
            };
        }.bind([timestamp]), 2000);

        // nav.setMenu();

        if (typeof before_drawing_view === "function") {
            before_drawing_view(views, context);
        }

        // Remove the "open" class from anything in the newly active elements
        $(onElems).removeClass("open").find(".open").removeClass("open");
        // Draw the new section
        $(onElems).addClass("draw").addClass("transition-in").removeClass("transition-out");
        // Update the "from" and "to" fields of the newly active elements based on their view-level
        for (var i = 0; i < nav.contexts[context].length; i++) {
            activeElems.filter("[data-view-level='" + i + "']").data("to", "").data("from", nav.contextsLast[context][i]);
            offElems.filter("[data-view-level='" + i + "']").data("from", "").data("to", nav.contexts[context][i]);
        };

        // Handle sequence numbering if a view element is in a sequence
        var seqElements = $(onElems).filter("[data-seq-num]");
        if (seqElements.length > 0) {
            $(seqElements).each(function(index, el) {
                var sibs = $(el).siblings("[data-seq-num]");
                var curSeqNum = $(el).data("seq-num") * 1;
                var befores = $(sibs).filter(function(index) {
                    if ($(this).data("seq-num") * 1 < curSeqNum) {
                        return true;
                    }
                });
                var afters = $(sibs).not($(befores));
                $(befores).addClass("seq-before").removeClass("seq-after");
                $(afters).addClass("seq-after").removeClass("seq-before");
            });
        }

        // Handle track-view elements
        $(tracking_path).data("track-view", new_level_path);
        $(tracking_path).data("track-from-view", old_level_path);
        for (var i = 0; i < nav.contexts[context].length; i++) {
            var trackingCurLevel = tracking_level.filter("[data-track-level='" + i +"']");
            trackingCurLevel.data("track-view", nav.contexts[context][i]);
        };

        setTimeout(function() {
            requestAnimationFrame(function() {

                //if we've defined a function that we want to run after we draw,
                //run it.
                if (typeof after_drawing_view === "function") {
                    after_drawing_view(views, context);
                }

                $(onElems).find(".x-scrollable .scroll-container").scrollTop(0);
                $(offElems).removeClass("show").addClass("transition-out").removeClass("transition-in");
                $(onElems).addClass("show").addClass("draw").removeClass("transition-in").removeClass("seq-before").removeClass("seq-after");

                $(offElems).find(".track-view-show.view-show").removeClass("view-show");
                $(onElems).find(".track-view-show").each(function() {
                    if ($(this).closest("[data-view]").hasClass("show")) {
                        $(this).addClass("view-show");
                    }
                })

                nav.contextListeners[context].filter("[data-track-view-show]").removeClass("view-show");
                var allViews = [];
                if (nav.contexts[context] !== undefined) {
                    allViews = nav.contexts[context].slice(0);
                }
                var selectorString = "";
                for (var i = 0; i < allViews.length; i++) {
                    selectorString += "[data-track-view-show~=" + allViews[i] + "], ";
                };
                if (selectorString.length) {
                    selectorString = selectorString.slice(0, -2);
                }
                nav.contextListeners[context].filter("[data-track-view-show]").filter(selectorString).addClass("view-show");

                setTimeout(function() {
                    requestAnimationFrame(function() {
                        $(onElems).addClass("draw-heavy");

                        // Find all scrollable content and determine if the content in the container is smaller than the container itself
                        $(onElems).find(".x-scrollable").each(function(index, el) {
                            if ($(el).closest("[data-view]").hasClass("show")) {
                                var scrollContainer = $(el).find(".scroll-container");
                                var scrollContent = $(el).find(".scroll-content");
                                var ctnrH = $(scrollContainer).get(0).offsetHeight;
                                var ctntH = $(scrollContent).get(0).scrollHeight;
                                if (ctntH <= ctnrH + (2 * scrollLeeway)) {
                                    $(el).addClass("no-scroll");
                                } else {
                                    $(el).removeClass("no-scroll");
                                }
                                var sID = $(el).data("scroll-id");
                                $(el).data("scroll-end", "at-top");
                                if (scrollables[sID]) {
                                    scrollables[sID].lastScroll = 0;
                                    scrollables[sID].containerH = ctnrH;
                                    scrollables[sID].contentH = ctntH;
                                    scrollables[sID].gettingContentH = false;
                                    scrollables[sID].gettingContainerH = false;
                                    scrollables[sID].atTop = true;
                                    scrollables[sID].atBottom = false;
                                    scrollables[sID].touched = false;
                                    scrollables[sID].scrolled = false;
                                }
                            }
                        });

                        //if we've defined a function that we want to run after we show,
                        //run it.
                        if (typeof after_showing_view === "function") {
                            after_showing_view(views, context);
                        }
                    });
                }, 50);
            });
        }, 50);







        nav.currentOnElems[context] = activeElems;
    },
}

