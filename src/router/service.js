const app = require("express");
const router = app.Router();
const getConnection = require('../db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

const alertTalk = require('../utill/kakao');


AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});
const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'mango-s3',
        key(req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, 'service/' + file.originalname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1])
            //cb(null, `post/${Date.now()}_${path.basename(file.originalname)}`)
        }
    }),
})

//main reg
router.post("/index", (req, res) => {
    const { name, password, phone, category, address, symptom } = req.body
    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`insert into service (name, password, phone, type, address, symptom, progress, reg_date) values (?, ?, ?, ? ,?, ?, 0, curdate())`, [name, password, phone, category, address, symptom], function (err, rows, fields) {
                if (err) {
                    console.log(err)
                    reject('sevice');
                } else {
                    resolve(rows.insertId)
                    //alertTalk(phone, address, category);
                    res.json({ success: true });
                }
            })
        }).catch((e) => {
            console.log(e);
            conn.rollback();
            res.json({ success: fail });
        }).finally(() => {
            conn.commit();
        });
    })
})


//main 
router.get("/index", (req, res) => {
    getConnection((conn) => {
        conn.query(`select service_id, name, substring(symptom,1,100) as symptom, date_format(reg_date, '%Y-%m-%d') reg_date, progress 
        from service
        order by service_id desc
        limit 6`, [], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ message: 'error' });
            } else {
                res.json(rows);
            }
        })
    })
})

//서비스 리스트
router.get("/", (req, res) => {
    const { page, input } = req.query;
    const input_query = "%" + input + "%";
    getConnection((conn) => {
        conn.query(`select service_id, name, substring(symptom,1,100) as symptom, date_format(reg_date, '%Y-%m-%d') reg_date, progress, (select count(service_id) count from service where symptom like ? ) count
        from service 
        where symptom like ?
        order by service_id desc limit ?, 8`, [input_query, input_query, (Number(page) - 1) * 8], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ message: 'error' });
            } else {
                //console.log(rows);
                res.json({ success: true, data: rows });
            }
        })
    })
})

//서비스 상세
router.get("/:id", (req, res) => {
    getConnection((conn) => {
        conn.query(`select s.service_id, s.name, s.phone, s.address, s.symptom, s.type, s.password, s.progress, s.reply, date_format( s.reg_date, '%Y-%m-%d') reg_date, sf.file_name, sf.file_url 
        from service s left join (
                select service_id, group_concat(file_name) file_name, group_concat(file_url) file_url from service_file where service_id = ?
            )sf on s.service_id = sf.service_id
        where s.service_id = ?`, [req.params.id, req.params.id], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ message: 'error' });
            } else {
                //console.log(rows);
                res.json(rows[0]);
            }
        })
    })
})

//서비스 등록
router.post("/", upload.array('file', 10), (req, res) => {
    const input = JSON.parse(req.body.input);
    const { name, password, phone, category, address, symptom } = input

    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`insert into service (name, password, phone, type, address, symptom, progress, reg_date) values (?, ?, ?, ? ,?, ?, 0, curdate())`, [name, password, phone, category, address, symptom], function (err, rows, fields) {
                if (err) {
                    console.log(err)
                    reject('sevice');
                } else {
                    resolve(rows.insertId)
                }
            })
        }).then((result) => {
            if (req.files.length == 0) {
                return new Promise((resolve, reject) => {
                    alertTalk(phone, address, category);
                    resolve();
                    res.json({ success: true });
                })
            } else {
                const fileArr = [];
                for (let i = 0; i < req.files.length; i++) {
                    fileArr.push([result, req.files[i].originalname, req.files[i].location]);
                }
                return new Promise((resolve, reject) => {
                    conn.query(`insert into service_file(service_id, file_name, file_url) values ?`, [fileArr], function (err, rows, fields) {
                        if (err) {
                            reject('file');
                            console.log(err)
                        } else {
                            resolve();
                            alertTalk(phone, address, category);
                            res.json({ success: true });
                        }
                    })
                })
            }
        }).catch((e) => {
            console.log(e);
            conn.rollback();
            res.json({ success: fail });
        }).finally(() => {
            conn.commit();
        });
    })
})


//서비스 삭제
router.delete("/:id", (req, res) => {
    const { deleteFile } = req.body;
    const deleteParam = {
        Bucket: 'mangos3',
        Delete: {
            Objects: [
                // {Key: 'a.txt'},
                // {Key: 'b.txt'},
                // {Key: 'c.txt'}
            ]
        }
    };

    if (typeof deleteFile == 'string') {
        deleteParam.Delete.Objects.push({ Key: `${deleteFile.split('/')[3]}` + `/${deleteFile.split('/')[4]}` })
    } else {
        if (deleteFile == undefined) {

        } else {
            for (let i = 0; i < deleteFile.length; i++) {
                deleteParam.Delete.Objects.push({ Key: `${deleteFile[i].split('/')[3]}` + `/${deleteFile[i].split('/')[4]}` })
            }
        }
    }
    if (deleteFile) {
        s3.deleteObjects(deleteParam, function (err, data) {
            if (err) console.log(err, err.stack);
            else console.log('delete', data);
        });
    }

    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`delete from service_file where service_id=?`, [req.params.id], function (err, rows, fields) {
                if (err) {
                    reject('filse');
                } else {
                    resolve()
                }
            })
        }).then(() => {
            return new Promise((resolve, reject) => {
                conn.query(`delete from service where service_id=?`, [req.params.id], function (err, rows, fields) {
                    if (err) {
                        reject('service');
                        console.log(err)
                    } else {
                        resolve();
                        res.json({ success: true });
                    }
                })
            })
        }).catch((e) => {
            console.log(e);
            conn.rollback();
            res.json({ success: false });
        }).finally(() => {
            conn.commit();
        });
    })
})

router.put("/:id", upload.array('file', 10), (req, res) => {
    const { deleteFile, input } = req.body;
    const { name, phone, address, symptom, type, password } = JSON.parse(input);

    const deleteParam = {
        Bucket: 'mangos3',
        Delete: {
            Objects: [
                // {Key: 'a.txt'},
                // {Key: 'b.txt'},
                // {Key: 'c.txt'}
            ]
        }
    };

    if (typeof deleteFile == 'string') {
        deleteParam.Delete.Objects.push({ Key: `${deleteFile.split('/')[3]}` + `/${deleteFile.split('/')[4]}` })
    } else {
        if (deleteFile == undefined) {

        } else {
            for (let i = 0; i < deleteFile.length; i++) {
                deleteParam.Delete.Objects.push({ Key: `${deleteFile[i].split('/')[3]}` + `/${deleteFile[i].split('/')[4]}` })
            }
        }
    }

    if (deleteFile) {
        s3.deleteObjects(deleteParam, function (err, data) {
            if (err) console.log(err, err.stack);
            else console.log('delete', data);
        });
    }

    getConnection((conn) => {
        conn.beginTransaction();
        if (req.files.length != 0) {
            new Promise((resolve, reject) => {
                conn.query(`delete from service_file where service_id=?`, [req.params.id], function (err, rows, fields) {
                    if (err) {
                        reject('deleteFile');
                    } else {
                        resolve()
                    }
                })
            }).then(() => {
                const fileArr = [];
                for (let i = 0; i < req.files.length; i++) {
                    fileArr.push([req.params.id, req.files[i].originalname, req.files[i].location]);
                }

                return new Promise((resolve, reject) => {
                    conn.query(`insert into service_file(service_id, file_name, file_url) values ?`, [fileArr], function (err, rows, fields) {
                        if (err) {
                            reject('insertFile');
                        } else {
                            resolve();
                        }
                    })
                })
            }).then(() => {
                return new Promise((resolve, reject) => {
                    conn.query(`update service set name=?, phone=?, address=?, symptom=?, type=?, password=? where service_id = ?`, [name, phone, address, symptom, type, password, req.params.id], function (err, rows, fields) {
                        if (err) {
                            reject('update');
                        } else {
                            resolve();
                            res.json({ success: true });
                        }
                    })
                })
            }).catch((e) => {
                console.log(e);
                conn.rollback();
                res.json({ success: false });
            }).finally(() => {
                conn.commit();
            });
        } else {
            conn.query(`update service set name=?, phone=?, address=?, symptom=?, type=?, password=? where service_id = ?`, [name, phone, address, symptom, type, password, req.params.id], function (err, rows, fields) {
                if (err) {
                    console.log(err);
                    res.json({ success: false });
                } else {
                    conn.commit();
                    res.json({ success: true });
                }
            })
        }

    })
})


//reply
router.patch("/", (req, res) => {
    const { reply, progress, service_id } = req.body;
    getConnection((conn) => {
        conn.query(`update service set reply=?, progress= ? where service_id = ?`, [reply, progress, service_id], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ success: false });
            } else {
                conn.commit();
                res.json(rows);
            }
        })
    })
})


//서비스 체크
router.post("/check", (req, res) => {
    const { id, password } = req.body;
    getConnection((conn) => {
        conn.query(`select service_id from service where service_id = ? and password = ?`, [id, password], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({ success: false });
            } else {
                if (rows[0]) {
                    res.json({ success: true });
                } else {
                    res.json({ success: false });
                }
            }
        })
    })
})

module.exports = router;
