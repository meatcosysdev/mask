(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('stunboxService', stunboxService);

    stunboxService.$inject = ['$q', 'pouchdb'];

    // Declarations
    function stunboxService($q, pouchdb) {
        return {
            get_stunbox_missing_rfids: get_stunbox_missing_rfids,
            save_purchase_animal_tag: save_purchase_animal_tag,
        };

        // Reduce functions
        function stunboxAndPurchaseAnimalsFilter(doc) {
            if (doc.doc_type === 'stunbox_animals' || doc.doc_type === 'purchase_animals') {
                emit(doc);
            }
        }

        // End Filters
        function get_stunbox_missing_rfids() {
            var deferred = $q.defer();
            pouchdb.query(stunboxAndPurchaseAnimalsFilter, {include_docs: true}).then(function (result) {
                var animals = {};

                result.rows.forEach(function (animal) {
                    if (!animals[animal['doc']['fmid']]) {
                        animals[animal['doc']['fmid']] = {
                            counter: 1,
                            animal: animal.doc
                        }
                    } else {
                        animals[animal['doc']['fmid']]['counter']++;
                    }
                });

                var missing_animals = [];
                for (var key in animals) {
                    if (animals[key]['counter'] == 1) {
                        missing_animals.push(animals[key]['animal']);
                    }
                }

                deferred.resolve({missing_animals: missing_animals});
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function save_purchase_animal_tag(animal) {
            var deferred = $q.defer();

            pouchdb.get(animal._id)
                .then(function (_doc) {
                    animal._rev = _doc._rev;
                    pouchdb.put(animal);
                    deferred.resolve({});
                });

            return deferred.promise;
        }

    }
})
();