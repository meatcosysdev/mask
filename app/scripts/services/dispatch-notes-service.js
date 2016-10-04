(function () {
    'use strict';

    angular.module('MeatCoApp')
        .service('dispatchNotesService', dispatchNotesService);

    dispatchNotesService.$inject = ['$q', 'pouchdb'];

    // Declarations
    function dispatchNotesService($q, pouchdb) {
        return {
            save_notes_doc: save_notes_doc,
            get_dispatch_notes: get_dispatch_notes,
            update_note: update_note
        };

        function save_notes_doc(data) {
            var deferred = $q.defer();

            var notesDoc = {
                "doc_type": data.doc_type,
                "_id":  data.doc_type + new Date().toISOString(),
                "document_no": data.document_no,
                "current_status": "ToPrint",
                created_date: new Date().toLocaleDateString(),
                "htmlContent": data.htmlContent,
            };

            pouchdb.put(notesDoc).then(function (response) {
                deferred.resolve(response);
                toastr.success("PDF file was successfully saved to db!")

            }).catch(function (err) {
                deferred.reject(err);
                toastr.error("Something went wrong. Could not save pdf file to db!")
            });
            return deferred.promise;
        }

        function docsFilter(doc) {
            if (doc.doc_type === 'transfer_note' || doc.doc_type === 'sell_ofall_note' || doc.doc_type === 'purchase_note') {
                emit(doc);
            }
        }

        function get_dispatch_notes() {
            var deferred = $q.defer();
            pouchdb.query(docsFilter, {include_docs: true}).then(function (result) {
                deferred.resolve(result);

            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        }

        function update_note(note) {
            var deferred = $q.defer();

            pouchdb.get(note._id).catch(function (err) {
                if (err) toastr.error(err.message);
            }).then(function (doc) {
                doc.current_status = note.current_status;

                return pouchdb.put(doc).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (err) {
                    deferred.reject(err);
                });
            });

            return deferred.promise;
        }
    }
})();