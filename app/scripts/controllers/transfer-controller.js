(function () {
    angular.module('MeatCoApp')
        .controller('TransferController', transferController);

    transferController.$inject = ['$state', '$filter', 'data', 'transferAnimalService', 'dispatchNotesService', 'printService'];


    // Declarations
    function transferController($state, $filter, data, transferAnimalService, dispatchNotesService, printService) {
        var vm = this;

        vm.truck = {};
        vm.barcode = '';
        vm.barcode_options = {
            width: 2,
            height: 100,
            displayValue: true,
            textAlign: "center",
            fontSize: 18,
            backgroundColor: "",
            lineColor: "#000"
        };

        vm.transfer_animals = [];
        // Methods
        vm.goto = goto;
        vm.exit = exit;
        vm.selectAnimal = selectAnimal;
        vm.getTransferCandidates = getTransferCandidates;
        vm.loadPortion = loadPortion;
        vm.unloadPortion = unloadPortion;
        vm.printList = printList;


        if (data) {
            vm.truck = data.truck || {};
        }

        if ($state.current.name == 'transfer.barcode') {
            $('#barcode').focus();
        }

        if ($state.current.name == 'transfer.list') {
            vm.getTransferCandidates();
        }



        // IMPLEMENTATION
        function selectAnimal(animal) {
            vm.truck.transfer_animals.forEach(function (a) {
                a.isSelected = false;
            });
            animal.isSelected = true;
        }

        // Get all portions marked as TRANSFERRED
        function getTransferCandidates() {
            transferAnimalService.get_transfer_animals({
                truck_id: vm.truck.transfer_vehicle_registration_no,
                include_docs: true
            }).then(function (response) {
                console.log(response.rows);

                vm.truck.transfer_animals = response.rows.map(function (a) {

                    return {
                        "id": a.id,
                        "slaughter_on": moment(a.doc.slaughter_on).format('MMM DD, YYYY hh:mm'),
                        "body_counter": a.doc.daily_counter,
                        "weight": a.doc.calculated_mass,
                        "side_part": a.doc.side_part,
                        "side": a.doc.side,
                        "barcode": a.doc.barcode,
                        "loaded_date": moment(a.doc.loaded_to_truck_on).format('MMM DD, YYYY hh:mm:ss'),
                        "health": a.doc.is_condemned ? a.doc.condemnation || 'n/a' : 'Healthy'
                    }
                });

                // Sort by loaded_on date (used on DISPATCH page)
                vm.truck.transfer_animals = $filter('orderBy')(vm.truck.transfer_animals, "-loaded_date");

                if (vm.truck.transfer_animals.length) {
                    vm.last_portion = vm.truck.transfer_animals[0];
                } else {
                    vm.last_portion = {};
                }

            });
        }

        function unloadPortion(portion) {
            // Restore portion status in db
            transferAnimalService.unload_portion(portion.id)
                .then(function () {
                    // Remove from UI
                    vm.truck.transfer_animals.splice(vm.truck.transfer_animals.indexOf(portion), 1);

                    if (vm.truck.transfer_animals.length) {
                        vm.last_portion = vm.truck.transfer_animals[0];
                    } else {
                        vm.last_portion = {};
                    }
                });
        }

        function loadPortion() {
            vm.truck.transfer_document_no = [
                new Date().toLocaleDateString(),
                vm.truck.transfer_vehicle_registration_no
            ].join('/');

            vm.truck.barcode = vm.barcode;
            vm.truck.status = 'Transferred';

            transferAnimalService.load_portion(vm.truck)
                .then(function () {
                    $state.go('transfer.list', {data: {truck: vm.truck}});
                });
        }

        function goto(state) {
            $state.go(state, {data: {truck: vm.truck}});
        }

        function exit() {
            $state.go('home');
        }

        function printList() {
            var note = {
                doc_type: 'transfer_note',
                htmlContent: $('#transfer_pdf_content').html()
            };

            dispatchNotesService.save_notes_doc(note).then(function () {
                printService.print(note);
            });
        }
    }
})();