(function () {
    angular.module('MeatCoApp')
        .controller('DispatchNotesController', dispatchNotesController);

    dispatchNotesController.$inject = ['dispatchNotesService', 'printService'];

    // Declarations
    function dispatchNotesController(dispatchNotesService, printService) {
        var vm = this;

        vm.printDocument = printDocument;
        vm.get_notes = get_notes;

        // INIT
        vm.get_notes();

        // IMPLEMENTATIONS
       function get_notes() {
            dispatchNotesService.get_dispatch_notes().then(function (result) {
                vm.dispatch_notes = result.rows.map(function (a) {
                    return {
                        "_id": a.doc._id,
                        "current_status": a.doc.current_status,
                        "created_date": a.doc.created_date,
                        "htmlContent": a.doc.htmlContent,
                        "doc_type": a.doc.doc_type
                    }
                });
            })
        }

        function printDocument(data) {
            data.current_status = "printed";
            dispatchNotesService.update_note(data);
            printService.print(data);
        }
    }
})();