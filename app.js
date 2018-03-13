(function($) {
    require(["./bower_components/backbone-amd/backbone"], function(Backbone) {
        
        var common = {
            errorPage: function() {
                var bootstrapAlert = new BootstrapAlert({
                    message : 'Requested Resource Not Found',
                    type: 'Warning'
                });
                $('#status-messages').html(bootstrapAlert.el).show();
            }
        },

        execute = function() {
            var context = this;
            return {
                success: function(collection, response) {
                    fetchData.call(context, collection, response);
                },
                error: function(xhr, textStatus, errorThrown) {
                    common.errorPage();
                    return this;
                },
                complete: function() {
                    
                }
            };
        },
        
        /*** COLLECTIONS ***/
        
        VisionCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/ARR/vision.json"
        }),
        
        ThemeCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/ARR/theme.json"
        }),
        
        ConceptCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/ARR/concept.json"
        }),
        
        RequirementDefinitionCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/ARR/requirement_definition.json"
        }),
        
        RequirementsCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/ARR/requirements.json"
        }),
        
        ActionsCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/RAM/actions.json"
        }, common.errorPage),
        
        ActionsMaxCollection = Backbone.Collection.extend({
            initialize: function(options) {
                var context = this;
                this.fetched = 0;
                this.fetch(execute.apply(context));
                return this;
            },
            url: "data/RAM/actions-max.json"
        }, common.errorPage),
        
        ProductResultsView = Backbone.View.extend({
            tagName: 'div',
            className: 'row-fluid align-center decolumn_small',
            initialize: function(options) {
                $(this.el).append('<canvas id="' + options.canvas + '" width="800" height="800"></canvas>');
                $('#collection').append(this.el);
                this.render(options.collection, options.canvas);
                return this;
            },
            render: function(collection, id) {
                var data = {
                    labels : ["PRODUCT", "FEATURE", "FUNCTION", "COMPONENT"],
                    datasets : [{
                        fillColor : "rgba(220,220,220,0.5)",
			strokeColor : "rgba(220,220,220,1)",
			data : collection.data
                    }]
                };
                var ctx = document.getElementById(id).getContext("2d");
                new Chart(ctx).Bar(data,{
                    scaleOverride : true,
                    scaleSteps : 60,
                    scaleStepWidth : 0.5,
                    scaleStartValue : 0,
                    barValueSpacing : 10,
                    barDatasetSpacing : 20,
                });
            }
        }),
        
        ActionResultsView = Backbone.View.extend({
            tagName: 'div',
            className: 'row-fluid align-center decolumn_small',
            initialize: function(options) {
                $(this.el).append('<canvas id="' + options.canvas + '" width="1400" height="800"></canvas>');
                $('#collection').append(this.el);
                this.render(options.collection, options.canvas);
                return this;
            },
            render: function(collection, id) {
                var data = {
                    labels : [],
                    datasets : []
                };
                _.each(collection.element, function(element) {
                    data.labels.push(element.name);
                });
                _.each(["PRODUCT", "FEATURE", "FUNCTION", "COMPONENT"], function(level, index) {
                    var R = 150 - index * 15, G = 200 - index * 25, B = 220 - index * 10;
                    data.datasets.push({
			fillColor : "rgba(" + R + "," + G + "," + B + ",0.5)",
			strokeColor : "rgba(" + R + "," + G + "," + B + ",1)",
			data : []
                    });
                    _.each(collection.data, function(value) {
                        data.datasets[data.datasets.length - 1].data.push(value[level]);
                    });
                });
                var ctx = document.getElementById(id).getContext("2d");
                new Chart(ctx).Bar(data,{
                    scaleOverride : true,
                    scaleSteps : 30,
                    scaleStepWidth : 0.5,
                    scaleStartValue : 0,
                    barValueSpacing : 15,
                    barDatasetSpacing : 1,
                });
            }
        }),
        
        BootstrapAlert = Backbone.View.extend({
            initialize: function(options) {
                var view = this;
                $(this.el).html(view.render({
                    message: options.message,
                    type: options.type
                }));
                return this;
            },
            tagName: 'div',
            className: 'alert clearfix column_small decolumn_small',
            template: '<button type="button" class="close" data-dismiss="alert">&times;</button><strong><%= type %>!</strong> <%= message %>',
            render: function(options) {
                var func = _.template(this.template);
                return func(options);
            }
        }),
        
        AppRouter = Backbone.Router.extend({
            routes: {
                "!/display": "displayResults"
            },
            displayResults: function() {
                var vision = new VisionCollection(),
                theme = new ThemeCollection(),
                concept = new ConceptCollection(),
                requirement_definition = new RequirementDefinitionCollection(),
                requirements = new RequirementsCollection(),
                actions = new ActionsCollection(),
                actions_max = new ActionsMaxCollection();
        
                var interval = setInterval(function() {
                    if(vision.fetched == theme.fetched == concept.fetched == requirement_definition.fetched == requirements.fetched == actions.fetched == 1) {
                        (function() {
                            var product = new branchNodes({}, vision, theme, concept, requirement_definition, requirements);
                            var collection = {
                                data: product.product()
                            }, anotherCollection; 
                            new ProductResultsView({
                                collection: collection,
                                canvas: 'product-chart'
                            });
                            
                            var productLinked = new branchNodes({
                                omit_actions: true
                            }, vision, theme, concept, requirement_definition, requirements);
                            var collection = {
                                data: productLinked.productLinked()
                            }; 
                            new ProductResultsView({
                                collection: collection,
                                canvas: 'product-linked-chart'
                            });

                            var actionsCollection = actions.toJSON();
                            if(_.isArray(actionsCollection) && !_.isEmpty(actionsCollection)) {
                                anotherCollection = {
                                    element: actionsCollection,
                                    data: []
                                };
                                _.each(actionsCollection, function(element, index) {
                                    anotherCollection.data.push(new branchNodes(element, vision, theme, concept, requirement_definition, requirements));
                                });
                                new ActionResultsView({
                                    collection: anotherCollection,
                                    canvas: 'action-chart'
                                });
                            }
                            
                            var actionsMaxCollection = actions_max.toJSON();
                            if(_.isArray(actionsMaxCollection) && !_.isEmpty(actionsMaxCollection)) {
                                anotherCollection = {
                                    element: actionsMaxCollection,
                                    data: []
                                };
                                _.each(actionsMaxCollection, function(element, index) {
                                    anotherCollection.data.push(new branchNodes(element, vision, theme, concept, requirement_definition, requirements));
                                });
                                new ActionResultsView({
                                    collection: anotherCollection,
                                    canvas: 'action-max-chart'
                                });
                            }
                        })();
                        window.clearInterval(interval);
                    }
                }, 50);
            }
        });
        
        function fetchData(collection, response) {
            this.fetched++;
            if(!response) {
                this.errorPage();
            }
            return this;
        }
        
        function composition(func) {
            return func.call(null);
        }
        
        function branchNodes(element) {
            this.RAM = {
                PRODUCT: 0.00,
                FEATURE: 0.00,
                FUNCTION: 0.00,
                COMPONENT: 0.00
            };
            this.build = {
                VISION: {},
                THEME: {},
                CONCEPT: {},
                REQUIREMENT_DEFINITION: {},
                REQUIREMENTS: {}
            };
            
            var context = this,
            args = {},
            ARR = {
                VISION: {},
                THEME: {},
                CONCEPT: {},
                REQUIREMENT_DEFINITION: {},
                REQUIREMENTS: {}
            };
    
            var types = ['VISION', 'THEME', 'CONCEPT', 'REQUIREMENT_DEFINITION', 'REQUIREMENTS'];
            var OWN_KEY = "_ids";
            
            for(var index = 1; index < arguments.length; index++) {
                args[types[index - 1]] = arguments[index];
            }
            
            function buildBranch(id, ARR_TYPE, index) {
                if(!_.has(ARR[ARR_TYPE], id) && _.has(types, index + 1) && index <= 5) {
                    ARR[ARR_TYPE][id] = 1;
                    var NEXT_TYPE = types[index + 1];
                    var NEXT_KEY = NEXT_TYPE.toLowerCase() + OWN_KEY;
                    var NOW_KEY = ARR_TYPE.toLowerCase() + OWN_KEY;
                    var flag = 0;
                    if(_.has(args[ARR_TYPE].at(id).attributes, NEXT_KEY)) {
                        _.each(args[ARR_TYPE].at(id).attributes[NEXT_KEY], function(next_id) {
                            if(_.has(element, 'omit_actions') || _.find(element['mandatory_requirements'][NEXT_KEY], function(num) {
                                return next_id === num;
                            }) !== undefined) {
                                context.build[NEXT_TYPE][next_id] = 1;
                                buildBranch.call(null, next_id, NEXT_TYPE, index + 1);
                            }
                        });
                        incrementLevel(args[ARR_TYPE].at(id).attributes);
                        flag = 1;
                    }
                    if(_.has(args[ARR_TYPE].at(id).attributes, OWN_KEY)) {
                        _.each(args[ARR_TYPE].at(id).attributes[OWN_KEY], function(next_id) {
                            if(_.has(element, 'omit_actions') || _.find(element['mandatory_requirements'][NOW_KEY], function(num) {
                                return next_id === num;
                            }) !== undefined) {
                                context.build[ARR_TYPE][next_id] = 1;
                                buildBranch.call(null, next_id, ARR_TYPE, index + 1);
                            }
                        });
                        if(!flag) {
                            incrementLevel(args[ARR_TYPE].at(id).attributes);
                        }
                    }
                    return true;
                }
                return false;
            }
            
            function incrementLevel(item) {
                _.each(item["abstraction"], function(level) {
                    context.RAM[level] += (item["abstraction"].length > 0) ? 1.00/item["abstraction"].length : 0.00;
                });
            }
            
            function incrementComponent(item) {
                if(_.contains(item["abstraction"], "COMPONENT")) {
                    context.RAM["COMPONENT"] += (item["abstraction"].length > 0) ? 1.00/item["abstraction"].length : 0.00;
                }
            }
            
            function viewPageDomain() {
                var index = 0;
                _.each(element['mandatory_requirements'], function(item, key) {
                    _.each(item, function(id) {
                        var ARR_TYPE = key.replace("_ids", "").toUpperCase();
                        buildBranch.call(null, id, ARR_TYPE, index);
                    });
                    index++;
                });
                _.each(context.build, function(IDS, TYPE) {
                    _.each(IDS, function(value, req_id) {
                        incrementComponent(args[TYPE].at(req_id).attributes);
                    });
                });
                return context.RAM;
            }
            
            function productDomain() {
                _.each(args, function(element, TYPE) {
                    _.each(element.toJSON(), function(item, key) {
                        incrementLevel(item);
                    });
                });
                return _.values(context.RAM);
            }
            
            function productLinkedDomain() {
                var index = 0;
                _.each(args, function(element, ARR_TYPE) {
                    _.each(element.toJSON(), function(item, id) {
                        buildBranch.call(null, id, ARR_TYPE, index);
                    });
                    index++;
                });
                _.each(context.build, function(IDS, TYPE) {
                    _.each(IDS, function(value, req_id) {
                        incrementComponent(args[TYPE].at(req_id).attributes);
                    });
                });
                return _.values(context.RAM);
            }
            
            if(_.isObject(element) && _.has(element, "mandatory_requirements")) {
                return viewPageDomain();
            } else {
                return {
                    product: productDomain,
                    productLinked: productLinkedDomain
                };
            }
        }
        
        var Domain = new AppRouter();
        Backbone.history.start();
    });
    
})(jQuery);