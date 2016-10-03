(function () {
    angular.module('MeatCoApp')
        .controller('SellController', sellController);

    sellController.$inject = ['$scope', '$state', 'printService', 'saleOffalService', 'dispatchNotesService', 'data', 'CONFIG'];


    // Declarations
    function sellController($scope, $state, printService, saleOffalService, dispatchNotesService, data, CONFIG) {
        var vm = this;

        vm.buyer = vm.buyer || {};
        vm.sell_offal_vat = CONFIG.sell_offal_vat;
        vm.current_date = moment().format('DD/MM/YYYY');

        if (data) {
            vm.buyer = data.buyer || {};
            vm.current_sale = data.current_sale || {};
            vm.sales = data.sales || [];
            vm.totalAmount = data.totalAmount || 0;
            vm.totalQuantity = data.totalQuantity || 0;
            vm.totalVatAmount = data.totalVatAmount || 0;
        }

        vm.company = {
            name: 'Meatco Namibia',
            address: 'Sheffield Street Windhoek',
            phone: '+264 61 3216400',
            vat_name: 'Meat Corporation of Namibia',
            vat_number: '0200494015'
        };

        //
        $scope.$watch("vm.buyer", function validateBuyerForm(newValue, oldValue) {
                vm.validBuyer = (vm.buyer.id_name && vm.buyer.national_id) || (vm.buyer.vat_name && vm.buyer.vat_no);
            }, true
        );

        // Methods
        vm.goto = goto;
        vm.selectSale = selectSale;
        vm.printList = printList;
        vm.addSaleItem = addSaleItem;
        vm.updateTotals = updateTotals;
        vm.removeSale = removeSale;

        // IMPLEMENTATION
        function removeSale(sale) {
            vm.sales.splice(vm.sales.indexOf(sale), 1);
            vm.updateTotals();
        }

        function addSaleItem() {
            vm.disableBuyer = true;

            vm.sales = vm.sales || [];
            vm.current_sale.buyer_no = vm.buyer.national_id;
            vm.current_sale.line_value = vm.current_sale.unit_price * vm.current_sale.quantity;
            //vm.current_sale.line_vat = (vm.sell_offal_vat || 0) / 100 * vm.current_sale.line_value;
            vm.current_sale.line_total = vm.current_sale.line_value;
            vm.sales.push(vm.current_sale);

            vm.current_sale = {};
            vm.updateTotals();
        }

        function updateTotals() {
            vm.enabledTax = true;
            vm.totalAmount = vm.totalQuantity = 0;

            vm.sales.forEach(function (sale) {
                vm.totalAmount += sale.line_total;
                vm.totalQuantity += parseInt(sale.quantity);
            });

            vm.totalVatAmount = vm.sell_offal_vat ? vm.totalAmount * vm.sell_offal_vat / 100 : 0;

            vm.totalAmount = vm.totalAmount + vm.totalVatAmount;
        }

        function selectSale(sale) {
            vm.sales.forEach(function (a) {
                a.isSelected = false;
            });
            sale.isSelected = true;
        }

        function goto(state) {
            var data = {
                buyer: vm.buyer,
                current_sale: vm.current_sale,
                sales: vm.sales,
                totalAmount: vm.totalAmount,
                totalQuantity: vm.totalQuantity,
                totalVatAmount: vm.totalVatAmount
            };

            if (state == 'sell.tax') {
                vm.current_sale.sales_invoice_no = ['sale', new Date().toLocaleDateString(), vm.buyer.id_no].join('_');
                saleOffalService.save_sale_items(vm.buyer, vm.sales).then(function () {
                    $state.go(state, {data: data});

                });
            } else {
                $state.go(state, {data: data});

            }
        }

        function printList() {
            var note = {
                doc_type: 'sell_ofall_note',
                htmlContent: $('#sell_pdf_content').html()
            };

            dispatchNotesService.save_notes_doc(note).then(function () {
                printService.print(note);
            });
        }
    }
})();