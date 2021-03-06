const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

let corsOptions = {
    origin: ['http://localhost:3000', 'https://www.mangocom.co.kr', 'https://www.mangocom.co.kr/*', 'http://www.mangocom.co.kr', 'http://www.mangocom.co.kr/*', 'http://mangocom.co.kr', 'http://mangocom.co.kr/*', 'https://mangocom.co.kr', 'https://mangocom.co.kr/*']
}


//route
const member = require('./router/member');
const service = require("./router/service");
const product = require("./router/product");


//middleware
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/member", member);
app.use("/service", service);
app.use("/product", product);


app.get('/', (req, res) => {
    res.send('hello node');
})

app.listen(4000, () => console.log('4000번 포트에서 대기중')); 