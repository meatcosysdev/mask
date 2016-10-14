(function () {
    'use strict';

    angular.module('MeatCoApp')
        .constant('CONFIG', {
            db_name: 'meat_co',
            remove_db_server: 'http://192.168.1.201:5984/meat_co', //'http://192.168.1.201:5984/meat_co'
            print_server_url: 'http://192.168.1.201:3000/print', //'http://192.168.1.201:3000/print',
            websocket_server: 'ws://192.168.1.201:9292', //'ws://192.168.1.201:9292'
            sell_offal_vat: 15,
            meatboard_levy: 0.6,
            minimum_buy_price: 1000,
            sb_reload_interval: 60000,
            app_version: '1.2.0'
        });
})();