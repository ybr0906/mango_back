const app = require("express");
const router = app.Router();
const getConnection = require('../db');

router.post("/", (req, res) => {
    const { id, password } = req.body;
    getConnection((conn) => {
        conn.query(`select id_member from member where name = ? and password = ?`, [id, password], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ success: false });
            } else {
                console.log(rows);
                if (rows.length == 0) {
                    res.json({ success: false });
                } else {
                    const session_id = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
                    conn.query(`INSERT INTO member_log(id_member, session)VALUES(?,?)`, [rows[0].id_member, session_id], function (err, rows, fields) {
                        if (err) {
                            res.json({ success: false });
                        } else {
                            res.json({ success: true, sid: session_id });
                        }
                    });
                }
            }
        })
    })
})

router.post("/check", (req, res) => {
    getConnection((conn) => {
        conn.query(`select * from member_log where session = ?`, [req.body.sid], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ success: false });
            } else {
                if (rows.length == 0) {
                    res.json({ success: false });
                } else {
                    res.json({ success: true });
                }
            }
        })
    })
})

router.post("/logout", (req, res) => {
    getConnection((conn) => {
        conn.query(`delete from member_log where session = ?`, [req.body.sid], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ success: false });
            } else {
                if (rows.length == 0) {
                    res.json({ success: false });
                } else {
                    res.json({ success: true });
                }
                conn.commit();
            }
        })
    })
})

module.exports = router;