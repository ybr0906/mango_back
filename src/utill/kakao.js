const solapi = require("solapi").default;
const messageService = new solapi("NCSFCB8QGMZD0BZL", "GKCICYVQTLPRGOS3TLWFNJJF5HQRRAZB");

const alertTalk = () => {
    messageService.sendOne({
        to: "01037952388",
        from: "01055322155",
        text: "안녕",
        kakaoOptions: {
            pfId: "KA01PF2205140206470052BFoH0E3vRG",
            templateId: "KA01TP220514020859485n1LLB1twT2C",
            // variables: {
            //     "#{contents}": "contents",
            //     "#{url}": "https://ibaji.co.kr",
            // },
            // 치환문구가 있는 경우 추가, 반드시 key, value 모두 string으로 기입해야 합니다.


            // disbaleSms 값을 true로 줄 경우 문자로의 대체발송이 비활성화 됩니다.
            disableSms: true,
        }
    }).then(res => console.log(res));
}

module.exports = alertTalk;