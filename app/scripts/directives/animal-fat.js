(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalFat', animalFat);

    function animalFat() {
        animalFatDirectiveController.$inject = ['$scope'];

        return {
            restrict: 'E',
            scope: {
                result: '='
            },
            templateUrl: 'views/common/animal-fat.html',
            controller: animalFatDirectiveController,
            bindToController: true,
            link: link
        };

        function animalFatDirectiveController($scope) {
            $scope.result = ($scope.result || '').toString();

            $scope.buttons = [
                {value: '0', position: 0},
                {value: '1', position: 1},
                {value: '2', position: 2},
                {value: '3', position: 3},
                {value: '4', position: 4},
                {value: '5', position: 5},
                {value: '6', position: 6}
            ];

            // INIT
            init();

            // IMPLEMENTATIONS
            function init() {
                $scope.buttons.forEach(function (b) {
                    b.isSelected = b.value == $scope.result;
                });
            }

            $scope.addValue = addValue;

            // IMPLEMENTATIONS
            function addValue(button) {
                $scope.buttons.forEach(function (b) {
                    b.isSelected = false;
                });
                button.isSelected = true;
                $scope.result = button.value.toString();
            }
        }

        function link($scope, el, attrs) {
        }
    }
})();