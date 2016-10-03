(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalTeeth', animalTeeth);

    function animalTeeth() {
        animalTeethDirectiveController.$inject = ['$scope'];

        return {
            restrict: 'E',
            scope: {
                output: '=',
            },
            templateUrl: 'views/common/animal-teeth.html',
            controller: animalTeethDirectiveController,
            bindToController: true,
            link: link
        };

        function animalTeethDirectiveController($scope) {
            $scope.result = ($scope.result || '').toString();

            $scope.buttons = [
                {value: 'A', text: '0 - A', position: 0},
                {value: 'AB', text: '1-2 - AB', position: 1},
                {value: 'B', text: '3-6 - B', position: 2},
                {value: 'C', text: '7-8 - C', position: 3}
            ];

            // METHODS
            $scope.addValue = addValue;

            // INIT
            init();

            // IMPLEMENTATIONS
            function init() {
                $scope.buttons.forEach(function (b) {
                    b.isSelected = b.value == $scope.output;
                });
            }

            function addValue(button) {
                $scope.buttons.forEach(function (b) {
                    b.isSelected = false;
                });

                button.isSelected = true;
                $scope.output = button.value.toString();
            }
        }

        function link($scope, el, attrs) {
        }
    }
})();