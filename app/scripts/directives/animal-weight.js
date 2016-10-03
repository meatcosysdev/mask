(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('animalWeight', animalWeight);

    function animalWeight() {
        animalWeightDirectiveController.$inject = ['$scope', '$timeout'];

        return {
            restrict: 'E',
            scope: {
                alphaNumeric: '=',
                result: '=',
                valid: '=',
                changed: '=',
                regex: '@'
            },
            templateUrl: 'views/common/animal-weight.html',
            controller: animalWeightDirectiveController,
            bindToController: true,
            link: link
        };

        function animalWeightDirectiveController($scope, $timeout) {
            $scope.result = ($scope.result != undefined ? $scope.result : '').toString();

            $scope.buttons = [
                {value: '1', isOperator: false, position: 1},
                {value: '2', isOperator: false, position: 2},
                {value: '3', isOperator: false, position: 3},
                {value: '4', isOperator: false, position: 4},
                {value: '5', isOperator: false, position: 5},
                {value: '6', isOperator: false, position: 6},
                {value: '7', isOperator: false, position: 7},
                {value: '8', isOperator: false, position: 8},
                {value: '9', isOperator: false, position: 9},
                {value: '.', isOperator: false, position: 10},
                {value: '0', isOperator: false, position: 11},
                {value: '<-', isOperator: true, position: 12}
            ];

            if ($scope.alphaNumeric) {
                $scope.buttons.push(
                    {value: 'abc', isOperator: true, position: 14, switcher: true}
                );

                var i = 0;
                $scope.alphaButtons = 'EB EC ED IM TS XA XB YA YB YC YD ZA ZC ZD'.split(' ').map(function (l) {
                    return {value: l, isOperator: false, position: ++i};
                });

                $scope.alphaButtons.push(
                    {value: '<-', isOperator: true, position: 40},
                    //{value: '↑', isOperator: true, position: 41, transform: 'up'},
                    {value: '123', isOperator: true, position: 39, switcher: true}
                );
            }

            // METHODS
            $scope.addValue = addValue;

            // IMPLEMENTATIONS
            function transformLetters(b) {
                $scope.alphaButtons.forEach(function (l) {
                    l.value = b.transform == 'up' ? l.value.toUpperCase() : l.value.toLowerCase();
                });
                b.transform = b.transform == 'up' ? 'down' : 'up';
                b.value = b.transform == 'up' ? '↑': '↓' ;
            }

            function addValue(button) {
                var result = ($scope.result || '');
                if (button.isOperator) {
                    // Switch between letters and digits
                    if (button.switcher) {
                        $scope.alphaMode = !$scope.alphaMode;

                        // Uppercase
                    } else if (button.transform) {
                        transformLetters(button);

                        // Remove chars
                    } else if ($scope.result && $scope.result.length > 0) {
                        result = $scope.result.slice(0, -1);
                    }
                } else {
                    if (button.value == '.' && $scope.result.indexOf('.') > -1) return;
                    result = result + button.value;
                }

                if (isValid(result)) {
                    $scope.valid = true;
                    $scope.result = result;
                } else {
                    $timeout(function () {
                        $scope.changed = true;
                        $scope.valid = false;

                    }, 100);
                }
            }

            function isValid(input) {
                var pattern = new RegExp($scope.regex);
                return pattern.test(input);
            }
        }

        function link(scope, el, attrs, ctrl) {
        }
    }
})();