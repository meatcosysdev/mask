(function () {
    angular.module('MeatCoApp')
        .controller('BuyCattleController', buyCattleController);

    buyCattleController.$inject = ['$state', 'printService', 'buyCattleService', 'data', 'scannerService', 'dispatchNotesService', 'CONFIG'];

    // Declarations
    function buyCattleController($state, printService, buyCattleService, data, scannerService, dispatchNotesService, CONFIG) {
        var vm = this;
        var TRUCK_ID = '01';

        vm.meatboard_levy = CONFIG.meatboard_levy || 0;
        vm.minimum_price = CONFIG.minimum_buy_price || 1000;

        if (data) vm.data = data;
        vm.company = {
            name: 'Meatco Namibia',
            address: 'Sheffield Street Windhoek',
            phone: '+264 61 3216400',
            vat_name: 'Meat Corporation of Namibia',
            vat_number: '0200494015'
        };

        vm.producer = {};
        vm.buy_animal_list = [];
        if (data) {
            vm.producer = data.producer || {};
            vm.buy_animal_list = data.buy_animal_list || [];
            vm.buy_animal = data.buy_animal || {};
        }

        // Get data from the scanners
        if ($state.current.name == 'buy.animal') {
            scannerService.get_procurement_scanner_inputs().then(function (response) {
                vm.buy_animal.tag_no = response.visualTag;
                vm.buy_animal.weight = response.displayMass;
            });
        }

        // Prepare signatures and totals
        if ($state.current.name == 'buy.pay') {
            var prodCanvas = document.querySelector("#prod");
            var repCanvas = document.querySelector("#rep");

            vm.signatureRep = new SignaturePad(repCanvas, {});
            vm.signatureProd = new SignaturePad(prodCanvas, {});

            vm.totalTransport = vm.totalAdvance = vm.totalPrice = vm.totalFinalPrice = 0;
            vm.meatboard_levy_amount = 0;
            vm.buy_animal_list.forEach(function (animal) {
                animal.transport_deduction = animal.transport_deduction || 0;
                animal.advance = animal.advance || 0;

                vm.totalAdvance += animal.advance;
                vm.totalTransport += animal.transport_deduction;

                animal.meatboard_levy_amount = animal.price * vm.meatboard_levy / 100;
                animal.final_price = animal.price - animal.transport_deduction - animal.meatboard_levy_amount;

                vm.totalPrice += animal.price || 0;
                vm.totalFinalPrice += animal.final_price || 0;
                vm.meatboard_levy_amount += animal.meatboard_levy_amount;
            });

            vm.producer.vat_no = vm.producer.vat_no || 0;
            vm.vat_value = vm.producer.vat_no / 100 * (vm.totalFinalPrice - vm.totalAdvance);
        }

        // Check if animal is MOC
        if ($state.current.name == 'buy.price') {
            buyCattleService.get_moc_data(vm.buy_animal && vm.buy_animal.tag_no).then(function (rows) {
                if (rows && rows.length) {
                    vm.buy_animal.on_bip = true;
                    vm.buy_animal.bip_deduction = rows[0].doc.bip_deduction_value || 0;
                    vm.showMOCNotification = true;
                }
            });

            vm.buy_animal.advance = 3500;
        }

        // Methods
        vm.goto = goto;
        vm.print = print;
        vm.exit = exit;
        vm.changeMemberShipOption = changeMemberShipOption;
        vm.findProducer = findProducer;
        vm.rejectAnimal = rejectAnimal;
        vm.acceptAnimal = acceptAnimal;
        vm.clearSignature = clearSignature;
        vm.updateProducer = updateProducer;

        // IMPLEMENTATION
        function updateProducer() {
            buyCattleService.update_producer(vm.producer).then(function () {
                vm.goto('buy.animal');
            });
        }

        function changeMemberShipOption() {
            if (!vm.producer.want_membership) {
                delete vm.producer.telephone_no;
                delete vm.producer.physical_address;
                delete vm.producer.postal_address;
                delete vm.producer.email_address;
            }
        }

        function findProducer() {
            vm.producer.include_docs = true;
            buyCattleService.find_producer(vm.producer)
                .then(function (result) {
                    if (result.length > 0) {
                        vm.producer = angular.copy(result[0].doc);
                    } else {
                        delete vm.producer['_id'];
                        delete vm.producer['_rev'];
                        toastr.info("No results found!");
                    }
                });
        }

        function goto(state) {
            var data = {
                producer: vm.producer,
                buy_animal: vm.buy_animal,
                buy_animal_list: vm.buy_animal_list
            };

            $state.go(state, {data: data});
        }

        function exit() {
            $state.go('home');
        }

        function rejectAnimal() {
            if (!vm.buy_animal.price || vm.buy_animal.price > 50000 || vm.buy_animal.price < vm.minimum_price) {
                toastr.error("Price offer must be between $"+ vm.minimum_price + " and $50000");
                return;
            }

            vm.buy_animal.permit_no = vm.producer.permit_no;
            vm.buy_animal.transaction_accepted = false;
            vm.buy_animal.producer_no = vm.producer.producer_no;
            vm.buy_animal.truck_id = TRUCK_ID;

            buyCattleService.save_purchase_animal(vm.buy_animal).then(function () {
                vm.buy_animal = {};
                vm.goto('buy.animal');
            });
        }

        function acceptAnimal() {
            if (!vm.buy_animal.price || vm.buy_animal.price > 50000 || vm.buy_animal.price < vm.minimum_price) {
                toastr.error("Price offer must be between $"+ vm.minimum_price + " and $50000");
                return;
            }

            vm.buy_animal.permit_no = vm.producer.permit_no;
            vm.buy_animal.transaction_accepted = true;
            vm.buy_animal.purchase_invoice_no = ['purchase', new Date().toLocaleDateString(), vm.producer.id_no].join('_');
            vm.buy_animal.producer_no = vm.producer.producer_no;
            vm.buy_animal.truck_id = TRUCK_ID;

            buyCattleService.save_purchase_animal(vm.buy_animal).then(function () {
                if (vm.buy_animal_list.indexOf(vm.buy_animal) == -1) {
                    vm.buy_animal_list.push(vm.buy_animal);
                }

                vm.buy_animal = {};
                vm.goto('buy.animal');
            });
        }

        function clearSignature(type) {
            if (type == 'prod') {
                vm.signatureProd.clear();
            } else {
                vm.signatureRep.clear();
            }
        }

        function print() {
            var note = {
                doc_type: 'purchase_note',
                htmlContent: $('#purchase_pdf_content').html()
            };

            // Save content to db
            dispatchNotesService.save_notes_doc(note).then(function () {
                printService.print(note);
            });
        }
    }
})();