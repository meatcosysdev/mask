(function () {
    'use strict';

    angular
        .module('MeatCoApp.Directives')
        .directive('exportPdf', exportPdf);

    function exportPdf() {
        return {
            restrict: 'C',
            scope: {
                result: '='
            },
            link: link
        };


        function link($scope, elm, attrs) {
            $scope.$on('export-pdf', function (e, d) {
                elm.tableExport({type: 'pdf', escape: 'false'});
            });
        }
    }
})();