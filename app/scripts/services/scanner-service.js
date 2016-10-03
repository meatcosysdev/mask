(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('scannerService', scannerService);

    scannerService.$inject = ['$q', 'CONFIG'];

    // Declarations
    function scannerService($q, CONFIG) {
        return {
            get_stunbox_scanner_inputs: get_stunbox_scanner_inputs,
            get_procurement_scanner_inputs: get_procurement_scanner_inputs,
            get_grade_scale_scanner_inputs: get_grade_scale_scanner_inputs
        };

        function get_stunbox_scanner_inputs() {
            var deferred = $q.defer();
            var animal = {};

            var socketTag = new WebSocket(CONFIG.websocket_server + '/' + 'sbtag');
            socketTag.onmessage = function (event) {
                var r1 = {};
                try {
                    r1 = JSON.parse(event.data);
                } catch (e) {
                }

                animal.visualTag = r1.visualTag;

                // GET MASS
                try {
                    var socketMass = new WebSocket(CONFIG.websocket_server + '/' + 'sbscale');
                    socketMass.onmessage = function (event) {
                        var r = {};
                        try {
                            r = JSON.parse(event.data);
                        } catch (e) {
                        }
                        animal.displayMass = r.displayMass;
                    };
                } catch (e) {
                    console.log(e);
                }
                finally {
                    deferred.resolve(animal);
                }
            };

            return deferred.promise;
        }

        function get_grade_scale_scanner_inputs() {
            var deferred = $q.defer();

            var socketScale = new WebSocket(CONFIG.websocket_server + '/' + 'gradescale');
            socketScale.onmessage = function (event) {
                var response = {};
                try {
                    response = JSON.parse(event.data);
                } catch (e) {
                }

                deferred.resolve({displayMass: response.displayMass});
            };

            return deferred.promise;
        }

        function get_procurement_scanner_inputs() {
            var deferred = $q.defer();
            var animal = {};

            // TAG
            var socketTag = new WebSocket(CONFIG.websocket_server + '/' + 'proctag');
            socketTag.onmessage = function (event) {
                var r1 = {};
                try {
                    r1 = JSON.parse(event.data);
                } catch (e) {
                }

                animal.visualTag = r1.visualTag;

                try {
                    // MASS
                    var socketMass = new WebSocket(CONFIG.websocket_server + '/' + 'procscale');
                    socketMass.onmessage = function (event) {
                        var r = {};
                        try {
                            r = JSON.parse(event.data);
                        } catch (e) {
                        }
                        animal.displayMass = r.displayMass;
                    };
                } catch (e) {
                    console.log(e);
                }
                finally {
                    deferred.resolve(animal);
                }
            };

            return deferred.promise;
        }
    }
})();