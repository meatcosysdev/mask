(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalHealth', animalHealth);

    function animalHealth() {
        animalHealthDirectiveController.$inject = ['$scope'];

        return {
            restrict: 'E',
            scope: {
                isCondemned: '=',
                condemnation: '=',
            },
            templateUrl: 'views/common/animal-health.html',
            controller: animalHealthDirectiveController,
            bindToController: true,
            link: link
        };

        function animalHealthDirectiveController($scope) {
            $scope.result = ($scope.result || '').toString();

            $scope.main_buttons = [
                {value: 'healthy', text: 'Healthy', position: 0},
                {value: 'condemned', text: 'Condemned', position: 1},
            ];

            $scope.secondary_buttons = [
                {value: 'bruising', text: 'Bruising', position: 0},
                {value: 'contaminated', text: 'Contaminated', position: 1},
                {value: 'abscess', text: 'Abscess', position: 2},
                {value: 'measles', text: 'Measles', position: 3},
            ];

            // METHODS
            $scope.addValue = addValue;
            $scope.addMainValue = addMainValue;

            // INIT
            init();

            // IMPLEMENTATIONS
            function init() {
                $scope.secondary_buttons.forEach(function (b) {
                    b.isSelected = b.value == $scope.condemnation;
                });

                var mainButtonIndex = !$scope.isCondemned ? 0 : 1;
                $scope.main_buttons[mainButtonIndex].isSelected = true;
            }

            function addValue(button) {
                $scope.secondary_buttons.forEach(function (b) {
                    b.isSelected = false;
                });

                button.isSelected = true;
                $scope.condemnation = button.value.toString();
            }

            function addMainValue(button) {
                $scope.main_buttons.forEach(function (b) {
                    b.isSelected = false;
                });
                button.isSelected = true;
                $scope.isCondemned = button.value != 'healthy';

                if (!$scope.isCondemned) {
                    $scope.secondary_buttons.forEach(function (b) {
                        b.isSelected = false;
                    });
                    $scope.condemnation = '';
                }
            }
        }

        function link($scope, el, attrs) {
        }
    }
})();