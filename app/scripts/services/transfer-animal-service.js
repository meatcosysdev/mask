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
            get_transfer_documents_per_truck: get_transfer_documents_per_truck,
            save_transfer_document: save_transfer_document
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

        function transferDocuments(doc) {
            var midnight = new Date();
            midnight.setHours(0, 0, 0, 0);

            if (doc.doc_type === 'transfers') {
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

                            pouchdb.put(doc);

                        }).catch(function (err) {
                        });
                }

                deferred.resolve(result);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        // TRANSFER DOCUMENT
        function get_transfer_documents_per_truck(params) {
            var deferred = $q.defer();
            pouchdb.query(transferDocuments, params)
                .then(function (result) {
                    var docs = [];
                    result.rows.forEach(function (p) {
                        if (p.doc.truck_id == params.truck_id) {
                            docs.push(p);
                        }
                    });

                    deferred.resolve({rows: docs});
                }).catch(function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        function save_transfer_document(transferInfo) {
            var document_id = "transfer_" + transferInfo.transfer_document_no;

            pouchdb.get(document_id).catch(function (err) {
                if (err.name === 'not_found') {
                    var transfer_doc = {
                        _id: document_id,
                        truck_id: transferInfo.transfer_vehicle_registration_no,
                        document_no: transferInfo.transfer_document_no,
                        transfer_driver: transferInfo.transfer_driver,
                        transfer_vehicle_registration_no: transferInfo.transfer_vehicle_registration_no,
                        current_status: '',
                        doc_type: 'transfers'
                    };

                    pouchdb.put(transfer_doc);
                }
            }).then(function (existing_doc) {
                existing_doc.truck_id = transferInfo.transfer_vehicle_registration_no;
                existing_doc.document_no = transferInfo.transfer_document_no;
                existing_doc.current_status = 'loaded';
                existing_doc.transfer_driver = transferInfo.transfer_driver;
                //existing_doc.loaded_on = new Date().toISOString();

                pouchdb.put(existing_doc);

            }).catch(function (err) {
            });
        }
    }
})();