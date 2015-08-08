angular.module('app', ['signico'])
    .controller('MainController', MainController)
;


function MainController(SignicoLoader) {

    this.init = function() {
        this.signs = ['mandatory--turn_left--c-italy', 'information_pedestrian_crossing', 'prohibitory_speed_limit_120', 'not_in_set'];
        this.randSign();
        this.stype = 'another_non_existing';
        
    };

    this.randSign = function () {
        this.stype = this.signs[Math.floor(Math.random() * this.signs.length)];
    };

    this.init();
}
