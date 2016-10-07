(function () {
    angular.module('MeatCoApp')
        .controller('SlaughterController', slaughterController);

    slaughterController.$inject = ['$state', '$interval', 'CONFIG', '$rootScope', 'animalService', 'scannerService', 'dispatchNotesService', 'printService'];

    // Declarations
    function slaughterController($state, $interval, CONFIG, $rootScope, animalService, scannerService, dispatchNotesService, printService) {
        var vm = this;

        vm.slaughter_animal = $rootScope.slaughter_animal;

        // Methods
        vm.getSlaughterAnimals = getSlaughterAnimals;
        vm.selectAnimalForGrading = selectAnimalForGrading;
        vm.goto = goto;
        vm.gradeAnimal = gradeAnimal;
        vm.rePrint = rePrint;
        vm.exit = exit;
        vm.getSlaughterDetails = getSlaughterDetails;
        vm.selectSlaughter = selectSlaughter;
        vm.printReport = printReport;

        // INIT
        if ($state.current.name == 'slaughter') {
            vm.promise = $interval(function () {
                vm.getSlaughterAnimals();
            }, CONFIG.sb_reload_interval);
        }

        // Get data from the scanners
        if ($state.current.name == 'slaughter.weight') {
            scannerService.get_grade_scale_scanner_inputs().then(function (response) {
                vm.slaughter_animal.side_mass = response.displayMass;
            });
        }
        if ($state.current.name == 'slaughter.search') {
            vm.slaughter_date = new Date();
        }

        // IMPLEMENTATION
        function getSlaughterAnimals() {
            animalService.get_slaughter_animals({include_docs: true, descending: false})
                .then(function (animals) {
                    vm.animals = animals.rows.map(function (a) {
                        return {
                            "_id": a.doc._id,
                            body_counter: a.doc.daily_counter,
                            side: a.doc.side,
                            current_status: a.doc.current_status,
                            grading_fat: a.doc.grading_fat,
                            is_condemned: a.doc.is_condemned,
                            condemnation: a.doc.condemnation,
                            side_mass: a.doc.side_mass || ''
                        }
                    });
                });
        };

        function selectAnimalForGrading(animal) {
            vm.animals.forEach(function (a) {
                a.isSelected = false;
            });
            animal.isSelected = true;
            vm.slaughter_animal = $rootScope.slaughter_animal = animal;
        }

        function goto(state) {
            $interval.cancel(vm.promise);
            $state.go(state);
        }

        function gradeAnimal() {
            $rootScope.slaughter_animal.current_status = "Created";
            animalService.grade_slaughter_animals($rootScope.slaughter_animal).then(function () {
                delete $rootScope.slaughter_animal;
                $state.go('slaughter');
            });
        }

        function rePrint() {
            $rootScope.slaughter_animal.current_status = "RePrint";
            animalService.grade_slaughter_animals($rootScope.slaughter_animal);
        }

        function exit() {
            $interval.cancel(vm.promise);
            delete $rootScope.slaughter_animal;
            $state.go('home');
        }

        function getSlaughterDetails() {
            animalService.get_slaughter_animals_by_date(moment(vm.slaughter_date).format('YYYY-MM-DD'))
                .then(function (result) {
                    vm.slaughter_animals = result.rows.map(function (a) {
                        return {
                            tag_number: a.doc.rfid,
                            body_counter: a.doc.daily_counter,
                            fat_grading: a.doc.fat_grading || 'n/a',
                            teeth_grading: a.doc.teeth_grading || 'n/a',
                            live_mass: a.doc.live_mass || 'n/a',
                            left_mass: a.doc.left_mass || 'n/a',
                            right_mass: a.doc.right_mass || 'n/a',
                            slaughter_percent: a.doc.slaughter_percent
                        }
                    });
                });
        }

        function selectSlaughter(animal) {
            vm.slaughter_animals.forEach(function (a) {
                a.isSelected = false;
            });
            animal.isSelected = true;
        }

        function printReport() {
            var note = {
                doc_type: 'slaughter_report_note',
                htmlContent: $('#daily_pdf_report').html()
            };

            // Save content to db
            dispatchNotesService.save_notes_doc(note).then(function () {
                printService.print(note);
            });
        }
    }
})();