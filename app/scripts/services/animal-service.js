(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('animalService', animalService);

    animalService.$inject = ['$q', 'pouchdb'];


    // Declarations
    function animalService($q, pouchdb) {
        var TRUCK_ID = '01';

        return {
            get_stunbox_animals: get_stunbox_animals,
            save_stunbox_animal: save_stunbox_animal,
            get_slaughter_animals: get_slaughter_animals,
            grade_slaughter_animals: grade_slaughter_animals,
            get_slaughter_animals_by_date: get_slaughter_animals_by_date
        };

        // Reduce functions
        function slaughterDateFilter(doc) {
            if (doc.doc_type === 'slaughter_report') {
                emit(moment(doc.slaughter_on).format('YYYY-MM-DD'));
            }
        }

        function stunboxPortion(doc) {
            // Get animals added today, after midnight
            if (doc.doc_type === 'stunbox_animals' || doc.doc_type === 'purchase_animals') {
                emit(doc.fmid);
            }
        }

        function stunboxAnimalsFilter(doc) {
            var midnight = new Date();
            midnight.setHours(0, 0, 0, 0);

            // Get animals added today, after midnight
            if (doc.doc_type === 'stunbox_animals' && moment(doc.slaughter_on) > midnight) {
                emit(doc);
            }
        }

        function slaughterAnimalsFilter(doc) {
            var midnight = new Date();
            midnight.setHours(0, 0, 0, 0);

            if (doc.doc_type === 'slaughter_sides' && moment(doc.slaughter_on) > midnight) {
                emit(doc);
            }
        }

        // End Filters
        function get_stunbox_animals(params) {
            var deferred = $q.defer();
            pouchdb.query(stunboxAnimalsFilter, params).then(function (result) {
                deferred.resolve(result);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function save_stunbox_animal(animal) {
            if (animal._id) {
                return update_stunbox_animal(animal);
            } else {
                return add_new_stunbox_animal(animal);
            }
        }

        function update_stunbox_animal(animal) {
            var deferred = $q.defer();

            pouchdb.get(animal._id).catch(function (err) {
                if (err) toastr.error(err.message);
            }).then(function (doc) {
                doc.fmid = animal.rfid;
                doc.live_mass = animal.weight;

                return pouchdb.put(doc).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (err) {
                    deferred.reject(err);

                });
            });

            return deferred.promise;
        }

        function add_new_stunbox_animal(animal) {
            var deferred = $q.defer();

            // Avoid conflicts on body_counters
            get_stunbox_animals({}).then(function (response) {
                var doc = {
                    fmid: animal.rfid,
                    live_mass: animal.weight,
                    daily_counter: response.total_rows + 1,
                    doc_type: 'stunbox_animals',
                    slaughter_on: new Date().toISOString(),
                    current_status: '',
                    truck_id: TRUCK_ID
                };

                pouchdb.post(doc).then(function () {
                    // Auto generate 2 slaughter sides: left & right
                    add_slaughter_sides(doc);

                }).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (err) {
                });

            }).then(function (result) {
                deferred.resolve(result);
            }).catch(function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        // Slaughter
        function get_slaughter_animals_by_date(date) {
            var deferred = $q.defer();
            pouchdb.query(slaughterDateFilter, {
                key: date,
                include_docs: true
            }).then(function (result) {
                deferred.resolve({rows: result.rows});

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function get_slaughter_animals(params) {
            var deferred = $q.defer();
            pouchdb.query(slaughterAnimalsFilter, params).then(function (result) {
                deferred.resolve(result);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function grade_slaughter_animals(animal) {
            var deferred = $q.defer();

            pouchdb.get(animal._id).catch(function (err) {
                if (err) toastr.error(err);
            }).then(function (doc) {
                doc.current_status = animal.current_status;
                doc.is_condemned = animal.is_condemned;
                doc.condemnation = animal.condemnation;
                doc.grading_fat = animal.grading_fat;
                doc.side_mass = animal.side_mass;

                pouchdb.put(doc).then(function () {
                    // When grading generate barcodes for slaughter portions
                    add_slaughter_portions_barcodes(doc);

                    save_animal_to_slaughter_report(doc);

                }).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (err) {
                });

            }).then(function (result) {
                deferred.resolve(result);

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function save_animal_to_slaughter_report(animal) {
            var report_animal = {
                _id: animal.rfid + '_report',
                rfid: animal.rfid,
                truck_id: animal.truck_id,
                doc_type: 'slaughter_report',
                slaughter_on: animal.slaughter_on,
                daily_counter: animal.daily_counter
            };

            pouchdb.get(animal.rfid + '_purchase').catch(function (err) {
            }).then(function (purchase) {
                report_animal.live_mass = purchase.live_mass;
                report_animal.teeth_grading = purchase.teeth_grading;

                pouchdb.get(report_animal._id)
                    // UPDATE
                    .then(function (existing_animal) {
                        report_animal._rev = existing_animal._rev;
                        report_animal.left_mass = existing_animal.left_mass;
                        report_animal.right_mass = existing_animal.right_mass;
                        report_animal.fat_grading = existing_animal.fat_grading;

                        if (animal.side.toUpperCase() == 'LEFT') {
                            report_animal.left_mass = animal.side_mass;
                            report_animal.fat_grading = animal.grading_fat;

                        } else if (animal.side.toUpperCase() == 'RIGHT') {
                            report_animal.right_mass = animal.side_mass;
                        }

                        report_animal.slaughter_percent = report_animal.live_mass > 0 ? 100 * (parseInt(report_animal.left_mass || 0) + parseInt(report_animal.right_mass || 0)) / report_animal.live_mass : 'n/a';

                        return pouchdb.put(report_animal);
                        // INSERT
                    }).catch(function (error) {
                        if (animal.side.toUpperCase() == 'LEFT') {
                            report_animal.left_mass = animal.side_mass;
                            report_animal.fat_grading = animal.grading_fat;

                        } else if (animal.side.toUpperCase() == 'RIGHT') {
                            report_animal.right_mass = animal.side_mass;
                        }

                        report_animal.slaughter_percent = report_animal.live_mass > 0 ? 100 * (parseInt(report_animal.left_mass || 0) + parseInt(report_animal.right_mass || 0)) / report_animal.live_mass : 'n/a';

                        return pouchdb.post(report_animal);
                    });
            });
        }

        function add_slaughter_sides(animal) {
            var side_doc = {
                rfid: animal.fmid,
                truck_id: animal.truck_id,
                slaughter_on: animal.slaughter_on,
                daily_counter: animal.daily_counter,
                is_condemned: false,
                condemnation: '',
                grading_fat: '',
                current_status: 'Ungraded',
                doc_type: 'slaughter_sides'
            };

            ['Left', 'Right'].forEach(function (side) {
                side_doc.side = side;
                side_doc.side_mass = 0;

                side_doc._id = [
                    "slaughter_side_",
                    side_doc.slaughter_on,
                    side_doc.daily_counter,
                    side_doc.side
                ].join('/');

                pouchdb.post(side_doc);
            });
        }

        function add_slaughter_portions_barcodes(slaughter_side) {
            // UPDATE/CREATE
            ['FQ', 'HQ'].forEach(function (side_part) {
                add_portion(slaughter_side, side_part);
            });
        }

        function add_portion(slaughter_side, side_part) {
            var id = [
                "slaughter_portion_",
                moment(slaughter_side.slaughter_on).format('YYYY-MM-DD'),
                slaughter_side.daily_counter,
                slaughter_side.side,
                side_part
            ].join('/');

            pouchdb.get(id).catch(function (err) {
                if (err.name === 'not_found') {
                    var portion_weight = get_side_portion_weight(slaughter_side.side_mass, side_part);

                    var side_portion = {
                        _id: id,
                        truck_id: slaughter_side.truck_id,
                        slaughter_on: slaughter_side.slaughter_on,
                        daily_counter: slaughter_side.daily_counter,
                        calculated_mass: portion_weight,
                        side: slaughter_side.side,
                        side_part: side_part,
                        transfer_document_no: '',
                        current_status: slaughter_side.current_status,
                        doc_type: 'slaughter_portions'
                    };

                    get_barcode(slaughter_side, side_part, portion_weight).then(function (response) {
                        side_portion.barcode = response;
                        pouchdb.put(side_portion);
                    });
                }
            }).then(function (existing_doc) {
                if (!existing_doc) return;
                // New barcode because the mass has changed
                var portion_weight = get_side_portion_weight(slaughter_side.side_mass, side_part);

                get_barcode(slaughter_side, side_part, portion_weight).then(function (response) {
                    existing_doc.calculated_mass = portion_weight;
                    existing_doc.barcode = response;

                    pouchdb.put(existing_doc).then().catch(function (err) {
                        toastr.error(err.message);
                    });
                });
            }).catch(function (err) {
            });
        }

        function get_barcode(doc, side_portion, calculated_portion_weight) {
            var deferred = $q.defer();

            var fat_grading = doc.grading_fat || 0;

            pouchdb.query(stunboxPortion, {
                key: doc.rfid,
                include_docs: true
            }).then(function (result) {
                var purchases = result.rows.filter(function (r) {
                    return r.doc.doc_type == 'purchase_animals'
                });

                // Age + Fat
                var grade = "000", producer_no = '000001';
                if (purchases.length > 0) {
                    grade = purchases[0].doc.teeth_grading + fat_grading;

                    if (grade.length < 3) grade += ' ';
                    producer_no = purchases[0].doc.producer_no;
                }

                var animals = result.rows.filter(function (a) {
                    return a.doc.doc_type == 'stunbox_animals'
                });

                if (animals.length > 0) {
                    var animal = animals[0];

                    // Side mass
                    var portion_mass = calculated_portion_weight.split('.');
                    var portion_weight = ("00" + portion_mass[0]).slice(-3);
                    portion_weight = ( portion_weight + (portion_mass[1] ? portion_mass[1] : '' ) + "0").slice(0, 4);

                    // Animal weight
                    var animal_weights = animal.doc.live_mass.split('.');
                    var animal_weight = ("00" + animal_weights[0]).slice(-3);
                    animal_weight = (animal_weight + (animal_weights[1] ? animal_weights[1] : '') + "0").slice(0, 4);

                    var barcode = [
                        moment(doc.slaughter_on).format("YYYYMMDD"),
                        ("0" + doc.daily_counter).slice(-2),
                        doc.side.substring(0, 1),
                        side_portion.substring(0, 1),
                        ("00" + (doc.truck_id || '01')).slice(-2),
                        ("000000" + producer_no).slice(-6),
                        doc.rfid,
                        grade.toUpperCase(),
                        portion_weight,
                        animal_weight,
                        doc.condemnation == 'measles' ? 'Y' : 'N'
                    ].filter(function (s) {
                            return s != undefined
                        }).join('');

                    deferred.resolve(barcode);
                }

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function get_side_portion_weight(side_part_weight, side_portion_type) {
            return (side_portion_type == 'FQ' ? side_part_weight * 0.45 : side_part_weight * 0.55).toFixed(2);
        }
    }
})();