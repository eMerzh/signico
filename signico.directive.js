angular.module('signico', [])
    .directive('signico', signicoDirective)
    .factory('SignicoLoader', signicoLoader)
;

signicoDirective.$inject = [ '$compile', 'SignicoLoader'];
function signicoDirective($compile, SignicoLoader) {
    return {
        restrict: 'E',
        scope: {
            'signType': '@',
            'errors': '='
        },

        link: function (scope, element) {
            var signs = {};
            var transformations = {};

            var refreshTemplate = function () {
                scope.generateTemplate(scope.signType, signs, transformations);
            };

            SignicoLoader.then(function (data) {
                signs = data.signs;
                transformations = data.transformations;
                refreshTemplate();
            });

            scope.$watch('signType', function () {
                refreshTemplate();
            });

            scope.addErrors = function(errorType) {
                scope.errors = errorType;
                element.html('');
            };

            scope.generateTemplate = function (signType, trafficSigns, transformations) {
                scope.errors = null;
                var tpl = "";
                // Prevent Error if no trafficSigns are available yet?
                if (JSON.stringify(trafficSigns) === '{}') {
                    scope.addErrors('no_signs');
                    return;
                }

                if (signType === 'not_in_set') {
                    scope.addErrors('not_in_set');
                    return;
                }

                var markerObject = trafficSigns[signType];

                // Check if it's a speed limit
                var speedPattern = /prohibitory_speed_limit_\d{2,3}/;
                if (speedPattern.test(signType)) {
                    markerObject = trafficSigns['prohibitory_speed_limit'];
                }

                if (signType.indexOf('_brazil') > 0) {
                    var signCategory = signType.match(/([^_]*)/)[0];
                    var brazilMarker = signType.indexOf('_brazil');
                    var name = signType.substring(signCategory.length + 1, brazilMarker);
                    var newBrazilianName = signCategory + '--' + name + '--c-brazil';
                    markerObject = trafficSigns[newBrazilianName];
                }

                if (markerObject != null) {
                    tpl = '';
                    var ref = markerObject.elements;
                    for (var j = 0, len1 = ref.length; j < len1; j++) {
                        var el = ref[j];
                        var prefixedTransformations = [];
                        if (el.transform != null) {
                            var transformRegex = /\{[a-z0-9_]+\}/i;
                            while (el.transform.match(transformRegex) != null) {
                                var match = transformRegex.exec(el.transform);
                                el.transform = el.transform.replace(match[0], transformations[match[0].substr(1, match[0].length - 2)]);
                            }
                            var prefixes = ['-webkit-transform', '-ms-transform', 'transform'];
                            var index, k, len2;
                            for (index = k = 0, len2 = prefixes.length; k < len2; index = ++k) {
                                var p = prefixes[index];
                                prefixedTransformations[index] = p + ": " + el.transform + ";";
                            }
                        }
                        tpl += "<i class=\"t t-" + el.type + " t-c-" + el.color + "\" style=\"" + (prefixedTransformations.join(' ')) + "\"></i>";
                        if (el.type === 'height_value') {
                            tpl += "<i class=\"t t-content-3 t-c-black\">Nm</i>";
                        }
                        if (el.type === 'width_value') {
                            tpl += "<i class=\"t t-content-4 t-c-black\">Nm</i>";
                        }
                        if (el.type === 'weight_value') {
                            tpl += "<i class=\"t t-content-3 t-c-black\">Nt</i>";
                        }
                        if (el.type === 'content' || el.type === 'content-2' || el.type === 'content-3' || el.type === 'content-4') {
                            tpl += "<i class=\"t t-" + el.type + " t-c-" + el.color + " \">" + el.content + "</i>";
                        }
                        //not sure
                        if (!speedPattern.test(signType)) {
                            if (el.type === 'speed_value') {
                                tpl += "<i class=\"t t-content t-c-white\">N</i>";
                            }
                        }
                    }
                }
                if (speedPattern.test(signType)) {
                    var speedLimit = signType.split('_');
                    speedLimit = speedLimit[speedLimit.length - 1];
                    tpl += "<i class=\"t t-content" + (speedLimit.length > 2 ? '-' + speedLimit.length : '') + " t-c-black\">" + speedLimit + "</i>";
                }
                if(tpl == "") {
                    scope.addErrors('not_in_set');
                    return;
                }

                tpl = '<div class="t">' + tpl + '</div>';
                element.html('');
                element.append($compile(tpl)({}));
            }
        }
    };
}

signicoLoader.$inject = ['$http', '$q'];
function signicoLoader($http, $q) {
    var getSignData, getTransformations, shimEu, shimUs;

    getTransformations = $http.get("bower_components/traffico/transformations.json", {
        cache: true
    }).success(function (data) {
        return data;
    }).error(function (data) {
        throw new Error('cannot fetch transformations.json', data);
    });

    getSignData = function (type) {
        return $http.get("bower_components/traffico/" + type + ".json", {
            cache: true
        }).error(function (data) {
            throw new Error("cannot fetch /data/" + type + ".json}", data);
        });
    };


    shimUs = function (signs) {
        signs['school_school_obsolete'] = signs['school_obsolete'];
        signs['warning_Y_roads'] = signs['warning_y_roads'];
        signs['warning_added_lanes'] = signs['warning_added_lane'];
        signs['warning_curve_reverse_left'] = signs['warning_turn_reverse_left'];
        signs['warning_curve_reverse_right'] = signs['warning_turn_reverse_right'];
        signs['warning_double_reverse_curve'] = signs['warning_double_2_reverse_curve'];
        signs['warning_turn_curve_left'] = signs['warning_turn_left_curve'];
        signs['warning_turn_curve_right'] = signs['warning_turn_right_curve'];
        signs['warning_turn_curve_with_speed'] = signs['warning_turn_right_curve_speed'];
        signs['warning_loop_pretzel'] = signs['warning_pretzel_loop'];
        signs['warning_winding_road'] = signs['warning_winding_road_left'];

        return signs;
    };

    shimEu = function (signs) {
        signs['information_disable_persons'] = signs['information_disabled_parking'];
        signs['information--bus_stop--c-germany'] = signs['information_bus_stop'];
        signs['prohibitory_no_trucks'] = signs['prohibitory_trucks'];
        signs['prohibitory_no_motorcycles'] = signs['prohibitory_motorcycles'];
        signs['prohibitory_no_motor_vehicles'] = signs['prohibitory_motor_vehicles'];
        signs['danger_animals'] = signs['danger_wild_animals'];
        signs['danger_priority_next_intersection'] = signs['danger_next_intersection_right'];
        signs['danger_intersection'] = signs['danger_next_intersection'];
        signs['danger_road_works'] = signs['danger_construction'];
        signs['mandatory_go_left_or_straight'] = signs['mandatory_turn_left_or_straight'];
        signs['mandatory_go_right_or_straight'] = signs['mandatory_turn_right_or_straight'];
        signs['mandatory_pedestrian_cycle_dual_track'] = signs['mandatory_bicycle_pedestrian_dual_track'];
        signs['other_give_way'] = signs['priority_give_way'];
        signs['other_priority_road'] = signs['priority_priority_road'];
        signs['prohibitory_no_pedestiran_or_cycles'] = signs['prohibitory_pedestrians_and_bicycles'];
        signs['prohibitory_no_vehicle_with_dangerous_goods'] = signs['prohibitory_vehicles_with_dangerous_goods'];
        signs['prohibitory_noturn_left'] = signs['prohibitory_no_turn_left'];
        signs['prohibitory_noturn_right'] = signs['prohibitory_no_turn_right'];
        signs['prohibitory_on_overtaking'] = signs['prohibitory_overtaking'];
        signs['prohibitory_on_overtaking_trucks'] = signs['prohibitory_overtaking_trucks'];
        signs['prohibitory--no_cycles--c-sweden'] = signs['prohibitory_bicycles'];
        signs['prohibitory--no_pedestrian--c-sweden'] = signs['prohibitory_pedestrians'];
        signs['danger--cycle_crossing--c-finland'] = signs['danger_cycle_crossing'];
        signs['danger--cycle_crossing--c-italy'] = signs['danger_cycle_crossing'];
        signs['danger--cycle_crossing--c-sweden'] = signs['danger_cycle_crossing'];
        signs['danger--quayside_or_ferry_berth--c-germany'] = signs['danger_quayside_or_ferry_berth'];
        signs['danger--pedestrian_crossing--c-italy'] = signs['danger_pedestrian_crossing'];
        signs['danger--pedestrian_crossing--c-poland'] = signs['danger_pedestrian_crossing'];
        signs['danger--pedestrian_crossing--c-spain'] = signs['danger_pedestrian_crossing'];
        signs['danger--pedestrian_crossing--c-sweden'] = signs['danger_pedestrian_crossing'];
        signs['danger--school_crossing--c-england'] = signs['danger_school_crossing'];
        signs['danger--school_crossing--c-italy'] = signs['danger_school_crossing'];
        signs['danger--school_crossing--c-spain'] = signs['danger_school_crossing'];
        signs['danger--school_crossing--c-sweden'] = signs['danger_school_crossing'];
        signs['danger_road_bump'] = signs['danger_uneven_road'];
        signs['danger_two_way_traffic_ahead'] = signs['danger_contraflow'];
        signs['danger_roundabout_ahead'] = signs['danger_roundabout'];
        signs['danger_crossroads_with_priority_to_the_right'] = signs['danger_crossroads'];
        signs['mandatory--footpath--c-germany'] = signs['mandatory_footpath'];
        signs['mandatory--footpath--c-greece'] = signs['mandatory_footpath'];
        signs['mandatory--footpath--c-italy'] = signs['mandatory_footpath'];
        signs['mandatory--go_right--c-italy'] = signs['mandatory_go_right'];
        signs['mandatory--turn_left--c-italy'] = signs['mandatory_turn_left'];
        signs['mandatory--turn_right--c-italy'] = signs['mandatory_turn_right'];
        signs['priority--give_way_to_oncoming_vehicles--c-sweden'] = signs['priority_narrow2'];
        signs['priority_give_way_to_oncoming_vehicles'] = signs['priority_narrow2'];
        return signs;
    };

    var qUs = getSignData("us").then(function (data) {
        return shimUs(data.data);
    });
    var qEu = getSignData("europe").then(function (data) {
        return shimEu(data.data);
    });
    var qBr = getSignData("br").then(function (data) {
        return data.data
    });
    var qTrans = getTransformations.then(function (data) {
        return data.data
    });

    return $q.all([qUs, qEu, qBr, qTrans]).then(function (data) {
        var signs = angular.extend({}, data[0], data[1], data[2]);
        return {signs: signs, transformations: data[3]};
    });
}