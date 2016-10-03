(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalGender', animalGender);

    function animalGender() {
        animalGenderDirectiveController.$inject = ['$scope'];

        return {
            restrict: 'E',
            scope: {
                output: '=',
            },
            templateUrl: 'views/common/animal-gender.html',
            controller: animalGenderDirectiveController,
            bindToController: true,
            link: link
        };

        function animalGenderDirectiveController($scope) {
            $scope.result = ($scope.result || '').toString();

            $scope.buttons = [
                {value: 'male', text: 'Male', position: 0},
                {value: 'female', text: 'Female', position: 1}
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