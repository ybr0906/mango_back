const solapi = require("solapi").default;
const messageService = new solapi("NCSHPMR95TJSYH2O", "7AJG2QO9Q7ZZKKLSVQ0PNUHLRNPGQCV0");

const alertTalk = (phone, address, category) => {
    messageService.sendMany([
        // {
        //     to: "01080094613",
        //     from: "01090097747",
        //     text: `서비스문의 ${phone} / ${address} / ${category}`
        // },
        // {
        //     to: "01039596434",
        //     from: "01090097747",
        //     text: `서비스문의 ${phone} / ${address} / ${category}`
        // },
        // {
        //     to: "01090097747",
        //     from: "01090097747",
        //     text: `서비스문의 ${phone} / ${address} / ${category}`
        // },
        {
            to: "01037952388",
            from: "01090097747",
            text: `서비스문의 ${phone} / ${address} / ${category}`
        },
        {
            to: "01055322155",
            from: "01090097747",
            text: `서비스문의 ${phone} / ${address} / ${category}`
        },
        // 2번째 파라미터 항목인 allowDuplicates 옵션을 true로 설정할 경우 중복 수신번호를 허용합니다.
    ]).then(res => console.log(res));
}

module.exports = alertTalk;