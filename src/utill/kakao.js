const solapi = require("solapi").default;
const messageService = new solapi("NCSHPMR95TJSYH2O", "7AJG2QO9Q7ZZKKLSVQ0PNUHLRNPGQCV0");

const alertTalk = (phone, address, category) => {
    //store_as
    //business_trip_as
    //as
    //product
    //monitor
    //apple

    let service = '';

    if (category == 'store_as') {
        service = '매장방문';
    } else if (category == 'business_trip_as') {
        service = '출장방문';
    } else if (category == 'as') {
        service = '출장방문';
    } else if (category == 'product') {
        service = 'pc판매';
    } else if (category == 'monitor') {
        service = '노트북액정';
    } else if (category == 'apple') {
        service = '애플제품';
    } else {
        messageService.sendMany([
            {
                to: "01080094613",
                from: "01090097747",
                text: `서비스문의 ${phone} / ${address} / ${service}`
            },
            {
                to: "01039596434",
                from: "01090097747",
                text: `서비스문의 ${phone} / ${address} / ${service}`
            },
            {
                to: "01090097747",
                from: "01090097747",
                text: `서비스문의 ${phone} / ${address} / ${service}`
            },
        ]).then(res => console.log(res));
    }
}

module.exports = alertTalk;