(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('buyCattleService', buyCattleService);

    buyCattleService.$inject = ['$q', 'pouchdb'];


    // Declarations
    function buyCattleService($q, pouchdb) {
        var TRUCK_ID = '01';

        return {
            find_producer: find_producer,
            update_producer: update_producer,
            save_purchase_animal: save_purchase_animal,
            get_moc_data: get_moc_data,
            get_animal_grading: get_animal_grading,
        };

        // Reduce functions
        function producerFilter(doc) {
            if (doc.doc_type === 'producers') {
                emit(doc);
            }
        }

        function gradingFilter(doc) {
            if (doc.doc_type === 'purchase_animals') {
                emit(doc.fmid);
            }
        }

        function findMocFilter(doc) {
            if (doc.doc_type === 'bip_animals' && doc.current_status.toLowerCase() == 'active') {
                emit(doc.fmid);
            }
        }

        function get_animal_grading(tag_no) {
            var deferred = $q.defer();

            pouchdb.query(gradingFilter, {
                key: tag_no,
                include_docs: true
            }).then(function (result) {
                deferred.resolve(result.rows ? result.rows[0].doc: {});
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function find_producer(params) {
            var deferred = $q.defer();

            pouchdb.query(producerFilter, params).then(function (result) {
                var filters = [];
                if (params['producer_no']) filters.push({name: 'producer_no', value: params['producer_no']});
                if (params['id_name']) filters.push({name: 'id_name', value: params['id_name']});
                if (params['id_no']) filters.push({name: 'id_no', value: params['id_no']});
                if (params['vat_name']) filters.push({name: 'vat_name', value: params['vat_name']});
                if (params['vat_no']) filters.push({name: 'vat_no', value: params['vat_no']});
                if (params['physical_address']) filters.push({
                    name: 'physical_address',
                    value: params['physical_address']
                });
                if (params['postal_address']) filters.push({name: 'postal_address', value: params['postal_address']});
                if (params['telephone_no']) filters.push({name: 'telephone_no', value: params['telephone_no']});
                if (params['email_address']) filters.push({name: 'email_address', value: params['email_address']});

                // Filter results
                result = result.rows.filter(function (r) {
                    var found = true;
                    filters.forEach(function (f) {
                        found = found && (r.doc[f.name] == f.value);
                    });

                    return found;
                });

                deferred.resolve(result);

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function update_producer(producer) {
            var deferred = $q.defer();

            producer.doc_type = 'producers';
            producer._id = producer._id || 'producer_' + new Date().toISOString();
            delete producer.include_docs;
            delete producer.group_level;
            delete producer.skip;
            delete producer.limit;

            pouchdb.get(producer._id)
                // UPDATE
                .then(function (_doc) {
                    producer._rev = _doc._rev;
                    return pouchdb.put(producer);
                    // INSERT
                }).catch(function (error) {
                    return pouchdb.post(producer);
                }).then(function (info) {
                    if (producer.permit_no) {
                        var permit = {
                            '_id': producer.permit_no,
                            'doc_type': 'dvs_permits',
                            'permit_no': producer.permit_no
                        };

                        pouchdb.get(permit._id)
                            // UPDATE
                            .then(function (_doc) {
                                permit._rev = _doc._rev;
                                return pouchdb.put(permit);
                                // INSERT
                            }).catch(function (error) {
                                return pouchdb.post(permit);
                            });
                    }
                });
            deferred.resolve({});

            return deferred.promise;
        }

        function save_purchase_animal(animal) {
            var deferred = $q.defer();

            var animal_doc = {
                _id: animal.tag_no + '_purchase',
                purchase_invoice_no: animal.purchase_invoice_no,
                fmid: animal.tag_no,
                live_mass: animal.weight,
                teeth_grading: animal.teeth,
                fat_grading: animal.fat,
                gender_grading: animal.gender,
                on_bip: animal.on_bip,
                bip_deduction: animal.bip_deduction,
                price_offered: animal.price,
                transaction_accepted: animal.transaction_accepted,
                producer_no: animal.producer_no,
                advance: animal.advance,
                current_status: 'Created',
                doc_type: 'purchase_animals'
            };

            pouchdb.get(animal_doc._id)
                // UPDATE
                .then(function (_doc) {
                    animal_doc._rev = _doc._rev;
                    return pouchdb.put(animal_doc);
                    // INSERT
                }).catch(function (error) {
                    return pouchdb.post(animal_doc);
                }).then(function (info) {
                    if (animal.transaction_accepted) {
                        var purchase_invoice = {
                            _id: animal.purchase_invoice_no,
                            truck_id: TRUCK_ID,
                            producer_no: animal.producer_no,
                            purchase_on: new Date().toISOString(),
                            purchase_invoice_no: animal.purchase_invoice_no,
                            permit_no: animal.permit_no,
                            current_status: 'Created',
                            doc_type: 'purchase_invoices'
                        };

                        pouchdb.get(animal.purchase_invoice_no)
                            // UPDATE
                            .then(function (_doc) {
                                purchase_invoice._rev = _doc._rev;
                                return pouchdb.put(purchase_invoice);
                                // INSERT
                            }).catch(function (error) {
                                return pouchdb.post(purchase_invoice);
                            });
                    }
                    deferred.resolve(info);
                });

            return deferred.promise;
        }

        function get_moc_data(animal_tag) {
            var deferred = $q.defer();

            pouchdb.query(findMocFilter, {include_docs: true}).then(function (result) {
                var found = result.rows.filter(function (r) {
                    return animal_tag == r.doc.fmid;
                });

                deferred.resolve(found);

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }
    }
})();