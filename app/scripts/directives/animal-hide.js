(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalHide', animalHide);

    function animalHide() {
        animalHideDirectiveController.$inject = ['$scope'];

        return {
            restrict: 'E',
            scope: {
                result: '=',
            },
            templateUrl: 'views/common/animal-hide.html',
            controller: animalHideDirectiveController,
            bindToController: true,
            link: link
        };

        function animalHideDirectiveController($scope) {
            $scope.result = ($scope.result || '').toString();

            $scope.buttons = [
                {value: '1', text: '1', position: 0},
                {value: '2', text: '2', position: 1},
                {value: '3', text: '3', position: 2}
            ];

            // METHODS
            $scope.addValue = addValue;

            // INIT
            init();

            // IMPLEMENTATIONS
            function init() {
                $scope.buttons.forEach(function (b) {
                    b.isSelected = b.value == $scope.result;
                });
            }

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