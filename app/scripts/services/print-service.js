(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('printService', scannerService);

    scannerService.$inject = ['$http', '$q', '$timeout','CONFIG'];

    // Declarations
    function scannerService($http, $q, $timeout, CONFIG) {
        return {
            print: print
        };

        function print(note) {
            var deferred = $q.defer();

            $http({
                url: CONFIG.print_server_url,
                method: "POST",
                data: note,
                timeout: deferred.promise
            });

            $timeout(function () {
                deferred.resolve();
            }, 1000);
        }
    }
})();