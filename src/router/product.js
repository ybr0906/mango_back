const app = require("express");
const router = app.Router();
const getConnection = require('../db');

router.post("/", (req, res) => {
    // const { page, input } = req.query;
    // const input_query = "%" + input + "%";
    // getConnection((conn) => {
    //     conn.query(`select service_id, name, substring(symptom,1,100) as symptom, date_format(reg_date, '%Y-%m-%d') reg_date, progress, (select count(service_id) count from service where symptom like ? ) count 
    //     from sale 
    //     where title like ?
    //     order by service_id desc limit ?, 8`, [input_query, input_query, (Number(page) - 1) * 4], function (err, rows, fields) {
    //         if (err) {
    //             console.log(err);
    //             res.json({ message: 'error' });
    //         } else {
    //             //console.log(rows);
    //             res.json({ success: true, data: rows });
    //         }
    //     })
    // })
})


module.exports = router;