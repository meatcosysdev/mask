(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('transferAnimalService', transferAnimalService);

    transferAnimalService.$inject = ['$q', 'pouchdb'];


    // Declarations
    function transferAnimalService($q, pouchdb) {
        return {
            get_transfer_animals: get_transfer_animals,
            load_portion: load_portion,
            unload_portion: unload_portion,
        };

        // Reduce functions
        function transferAnimalsFilter(doc) {
            var midnight = new Date();
            midnight.setHours(0, 0, 0, 0);

            if (doc.doc_type === 'slaughter_portions'
                && doc.current_status == 'Transferred'
                && doc.transfered_on
                && moment(doc.transfered_on) > midnight) {
                emit(doc);
            }
        }

        function findPortionFilter(doc) {
            if (doc.doc_type === 'slaughter_portions') {
                emit(doc.barcode);
            }
        }

        function get_transfer_animals(params) {
            var deferred = $q.defer();
            pouchdb.query(transferAnimalsFilter, params)
                .then(function (result) {
                    var portions = [];
                    result.rows.forEach(function (p) {
                        if (p.doc.truck_id == params.truck_id) {
                            var id = ["slaughter_side_", p.doc.slaughter_on, p.doc.daily_counter, p.doc.side].join('/');

                            // Find slaughter side
                            pouchdb.get(id).catch(function (err) {
                            }).then(function (doc) {
                                if (doc) {
                                    p.doc.is_condemned = doc.is_condemned;
                                    p.doc.condemnation = doc.condemnation;
                                    portions.push(p);
                                }
                            });
                        }
                    });

                    deferred.resolve({rows: portions});
                }).catch(function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        function unload_portion(id) {
            var deferred = $q.defer();

            pouchdb.get(id).catch(function (err) {
                if (err.name === 'not_found') {
                    toastr.error("Record not found!");
                    deferred.reject(err);
                }
            }).then(function (doc) {
                doc.current_status = 'Created';
                doc.transfer_document_no = '';
                doc.loaded_to_truck_on = '';
                doc.truck_id = '';

                pouchdb.put(doc);

                deferred.resolve({});

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function load_portion(transferInfo) {
            var deferred = $q.defer();

            pouchdb.query(findPortionFilter, {
                key: transferInfo.barcode,
                include_docs: true
            }).then(function (result) {
                if (result.rows && result.rows.length > 0) {
                    var portion = result.rows[0];

                    pouchdb.get(portion.id)
                        .catch(function (err) {
                        })
                        .then(function (doc) {
                            doc.truck_id = transferInfo.transfer_vehicle_registration_no;
                            doc.current_status = transferInfo.status;
                            doc.transfered_on = new Date().toISOString();
                            doc.transfer_document_no = transferInfo.transfer_document_no;
                            doc.loaded_to_truck_on = new Date().toISOString();

                                // Update status and transfer doc number
                            pouchdb.put(doc).then(function () {

                                // Add transfer doc
                                save_transfer_info(transferInfo);
                            }).catch(function (err) {
                            });


                        }).catch(function (err) {
                        });
                }

                deferred.resolve(result);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function save_transfer_info(transferInfo) {
            pouchdb.get(transferInfo.transfer_document_no).catch(function (err) {
                if (err.name === 'not_found') {
                    var transfer_doc = {
                        _id: transferInfo.transfer_document_no,
                        truck_id: transferInfo.transfer_vehicle_registration_no,
                        transfer_driver: transferInfo.transfer_driver,
                        transfer_vehicle_registration_no: transferInfo.transfer_vehicle_registration_no,
                        current_status: '',
                        doc_type: 'transfers'
                    };

                    pouchdb.put(transfer_doc);
                }
            }).then(function (existing_doc) {
                existing_doc.truck_id = transferInfo.transfer_vehicle_registration_no;
                existing_doc.transfer_driver = transferInfo.transfer_driver;
                existing_doc.transfer_vehicle_registration_no = transferInfo.transfer_vehicle_registration_no;
                existing_doc.loaded_on = new Date().toISOString();

                pouchdb.put(existing_doc);

            }).catch(function (err) {
            });
        }
    }
})();