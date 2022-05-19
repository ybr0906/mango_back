const app = require("express");
const router = app.Router();
const multer = require('multer');
const getConnection = require('../db');

const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

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
            cb(null, 'product/' + file.originalname.split('.')[0] + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1])
            //cb(null, `post/${Date.now()}_${path.basename(file.originalname)}`)
        }
    }),
})


router.post("/", upload.fields([{ name: 'thumbnail_url', maxCount: 1 }, { name: 'detail_url', maxCount: 1 }]), (req, res) => {
    const { title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom } = JSON.parse(req.body.input);

    let thumb_url;
    let thumb_name;
    let de_url;
    let de_name;

    if (req.files['thumbnail_url']) {
        thumb_url = req.files['thumbnail_url'][0].location;
        thumb_name = req.files['thumbnail_url'][0].originalname;
    }
    if (req.files['detail_url']) {
        de_url = req.files['detail_url'][0].location;
        de_name = req.files['detail_url'][0].originalname;
    }

    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`insert into sale (title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom, thumbnail_url, detail_url, thumbnail_name, detail_name, reg_date) 
                values (?, ?, ?, ? ,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, curdate())`, [title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom, thumb_url, de_url, thumb_name, de_name], function (err, rows, fields) {
                if (err) {
                    console.log(err)
                    reject('sale');
                } else {
                    resolve(rows.insertId)
                    res.json({ success: true });
                }
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

router.get("/", (req, res) => {
    const { page } = req.query;
    getConnection((conn) => {
        conn.query(`select id_sale, title, contents, price, category, thumbnail_url, detail_url, cpu_value, mainboard, vga, (select count(id_sale) count from sale) count 
        from sale 
        order by id_sale desc limit ?, 8`, [(Number(page) - 1) * 8], function (err, rows, fields) {
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

router.get("/:id", (req, res) => {
    getConnection((conn) => {
        conn.query(`select title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom, thumbnail_url, detail_url , thumbnail_name, detail_name
        from sale
        where id_sale = ?`, [req.params.id], function (err, rows, fields) {
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

//수정
router.put("/:id", upload.fields([{ name: 'thumbnail_url', maxCount: 1 }, { name: 'detail_url', maxCount: 1 }]), (req, res) => {

    const { title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom, thumbnail_url, detail_url, thumbnail_name, detail_name } = JSON.parse(req.body.input);

    let thumb_url = thumbnail_url;
    let thumb_name = thumbnail_name;
    let de_url = detail_url;
    let de_name = detail_name;

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

    if (req.files['thumbnail_url']) {
        thumb_url = req.files['thumbnail_url'][0].location;
        thumb_name = req.files['thumbnail_url'][0].originalname;
        if (thumbnail_url == null) {

        } else {
            deleteParam.Delete.Objects.push({ Key: `${thumbnail_url.split('/')[3]}` + `/${thumbnail_url.split('/')[4]}` })
        }
    }
    if (req.files['detail_url']) {
        de_url = req.files['detail_url'][0].location;
        de_name = req.files['detail_url'][0].originalname;
        if (detail_url == null) {

        } else {
            deleteParam.Delete.Objects.push({ Key: `${detail_url.split('/')[3]}` + `/${detail_url.split('/')[4]}` })
        }
    }

    if (req.files['thumbnail_url'] || req.files['detail_url']) {
        s3.deleteObjects(deleteParam, function (err, data) {
            if (err) console.log(err, err.stack);
            else console.log('delete', data);
        });
    }

    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`update sale set title=?, contents=?, price=?, category=?, cpu_value=?, mainboard=?, vga=?, ram=?, hdd=?, ssd=?, power=?, case_value=?, cdrom=?, thumbnail_url=?, detail_url=?, thumbnail_name=?, detail_name=?
            where id_sale= ?`, [title, contents, price, category, cpu_value, mainboard, vga, ram, hdd, ssd, power, case_value, cdrom, thumb_url, de_url, thumb_name, de_name, req.params.id], function (err, rows, fields) {
                if (err) {
                    reject('update');
                } else {
                    resolve();
                    res.json({ success: true });
                }
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

router.delete("/:id", (req, res) => {
    const { thumbnail_url, detail_url } = req.body;

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


    if (thumbnail_url == null) {

    } else {
        deleteParam.Delete.Objects.push({ Key: `${thumbnail_url.split('/')[3]}` + `/${thumbnail_url.split('/')[4]}` })
    }

    if (detail_url == null) {

    } else {
        deleteParam.Delete.Objects.push({ Key: `${detail_url.split('/')[3]}` + `/${detail_url.split('/')[4]}` })
    }


    if (thumbnail_url || detail_url) {
        s3.deleteObjects(deleteParam, function (err, data) {
            if (err) console.log(err, err.stack);
            else console.log('delete', data);
        });
    }

    getConnection((conn) => {
        conn.beginTransaction();
        new Promise((resolve, reject) => {
            conn.query(`delete from sale where id_sale=?`, [req.params.id], function (err, rows, fields) {
                if (err) {
                    reject('filse');
                } else {
                    resolve()
                    res.json({ success: true });
                }
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



module.exports = router;