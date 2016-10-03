(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('saleOffalService', saleOffalService);

    saleOffalService.$inject = ['$q', 'pouchdb'];


    // Declarations
    function saleOffalService($q, pouchdb) {
        var TRUCK_ID = '01';

        return {
            save_sale_items: save_sale_items,
            update_buyer_info: update_buyer_info
        };

        function update_buyer_info(buyer) {
            var deferred = $q.defer();

            buyer._id = buyer['national_id'];
            buyer.doc_type = 'buyers';

            pouchdb.get(buyer._id)
                // UPDATE
                .then(function (_doc) {
                    buyer._rev = _doc._rev;
                    return pouchdb.put(buyer);
                    // INSERT
                }).catch(function (error) {
                    return pouchdb.post(buyer);
                }).then(function (info) {
                    deferred.resolve(info);
                });

            return deferred.promise;
        }

        function save_sale_items(buyer, sales) {
            var deferred = $q.defer();

            update_buyer_info(buyer);

            sales.forEach(function(sale_item) {
                var animal_doc = {
                    _id: Math.random().toString(36).substring(8),
                    sales_invoice_no: sale_item.sales_invoice_no,
                    stock_code: '',
                    type: sale_item.type,
                    quantity: sale_item.quantity,
                    unit_price: sale_item.unit_price,
                    line_value: sale_item.line_value,
                    line_vat: sale_item.line_vat,
                    line_total: sale_item.line_total,
                    sale_on: new Date().toISOString(),
                    current_status: 'Created',
                    doc_type: 'sales_items'
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

                        var sale_invoice = {
                            _id: sale_item.sales_invoice_no,
                            truck_id: TRUCK_ID,
                            buyer_no: sale_item.buyer_no,
                            sale_on: new Date().toISOString(),
                            sales_invoice_no: sale_item.sales_invoice_no,
                            current_status: 'Created',
                            doc_type: 'sales_invoices'
                        };

                        pouchdb.get(sale_invoice.purchase_invoice_no)
                            // UPDATE
                            .then(function (_doc) {
                                sale_invoice._rev = _doc._rev;
                                return pouchdb.put(sale_invoice);
                                // INSERT
                            }).catch(function (error) {
                                return pouchdb.post(sale_invoice);
                            });
                    });
                deferred.resolve({});
            });

            return deferred.promise;
        }
    }
})();