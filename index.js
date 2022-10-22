const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const { Client } = require('pg');

const client = new Client({
    host: "water.cvizemr2ibhx.ap-northeast-1.rds.amazonaws.com",
    user: "postgres",
    port: 5432,
    password: "postgres",
    database: "postgres"
});
const PORT=3001
client.connect();

client.query('Select * from users', (err, res)=>{
    if (!err) {
        console.log(res.rows);
    }else{
        console.log(err.message)
    }
    // client.end();
})

const app = express();

app.use(cors());
app.use(express.json());

// const db = mysql.createConnection({
//     user: "root",
//     host: "localhost",
//     password: "root1",
//     database: "durianWaterUser"
// })

app.post('/ping', (req, res) => {
    res.send('pong')
})

// app.get('/users', (req, res) => {
//     db.query("SELECT * FROM users", (err, result) =>{
//         if (err) {
//             console.log(err);
//         }else{
//             res.send(result);
//         }
//     })
// });

// app.get('/add', (req, res) => {
//     db.query("SELECT * FROM address", (err, result) =>{
//         if (err) {
//             console.log(err);
//         }else{
//             res.send(result);
//         }
//     })
// });

app.post('/addaddress', (req, res) => {

    const {user_id, name, number, village, lane, road, subdistrict, district, province, zipcode} = req.body
    //console.log(user_id);
    client.query("INSERT INTO address (user_id, name, number, village, lane, road, subdistrict, district, province, zipcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [user_id, name, number, village, lane, road, subdistrict, district, province, zipcode], (err, result, fields) => {
        if (!err) {
            console.log('success')
            res.send({ status: 'add success' });
        }else{
            console.log(err)
        }
    })
})

// edit address
app.put('/editaddress', (req, res) => {
    
    const {id,number, village, lane, road, subdistrict, district, province, zipcode} = req.body
    console.log(id);
    client.query("UPDATE address SET number = $2, village = $3, lane = $4, road = $5, subdistrict = $6, district = $7, province = $8, zipcode = $9 WHERE id =$1", [id,number, village, lane, road, subdistrict, district, province, zipcode], (err, result, fields) => {
        if (!err) {
            console.log('success')
            res.send({ status: 'edit success' });
        }else{
            console.log(err)
        }
    })
})

app.post('/register', (req, res) => {

    const {username, password, title, first_name, last_name } = req.body
    //console.log(user_id);
    client.query("INSERT INTO users (username, password, title, first_name, last_name) VALUES ($1, $2, $3, $4, $5)", [username, password, title, first_name, last_name], (err, result, fields) => {
        if (!err) {
            console.log('success')
            res.send({ status: 'register success' });
        }else{
            console.log(err)
        }
    })
})

// /localhost:3001/login
app.post('/login', async (req, res) => {

    console.log('[POST] /login', req.body);
    
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        try {
            const result = await client.query("SELECT * FROM users WHERE username=$1 AND password=$2", [username, password])

            console.log(result.rows.length);
            if (result.rows.length > 0) {
                console.log("suc");
                req.body.username = username;
                req.body.password = password;
                res.send({
                    status: 'login success',
                    result: result
                });
            }
            else {
                console.log("fail");
                res.send({ status: 'login failed' });
            }
        }
        catch (e) {
            console.log(e);
            res.send({ status: 'error', message: e })
        }
        // finally {
        //     client.end();
        // }
    }
})

app.post('/garden', (req, res) => {

    const user_id = req.body.user_id;
    console.log(user_id);
    client.query("SELECT id FROM address WHERE user_id=$1 ",[user_id], (err, result, fields) =>{
        res.send({
            status: true,
            result: result});
        console.log(result);
    })
})


app.post('/address', (req, res) => {

    const id = req.body.id;
    console.log(id);
    client.query("SELECT * FROM address WHERE id=$1 ",[id], (err, result, fields) =>{
        res.send({
            status: true,
            result: result});
    })
})

//changepassword password
app.put('/changepassword', (req,res) => {
    
    const {user_id,password} = req.body

    client.query("UPDATE users SET password=$1 WHERE user_id = $2", [password,user_id],(err, result, fields) => {
        if (!err) {
            console.log('success')
            res.send({ status: 'Change password success' });
        }else{
            console.log(err)
        }
    })
})

app.post('/history', (req, res) => {

    const user_id = req.body.user_id;
    const fromDate = req.body.fromDate;
    const toDate = req.body.toDate;
    console.log(toDate);
    client.query("SELECT * FROM result WHERE user_id=$1 AND date>=$2 AND date<=$3 ",[user_id,fromDate,toDate], (err, result, fields) =>{
        res.send({
            result: result});
        console.log(result);
    })
})


app.post('/getresult', (req, res) => {

    const result_id = req.body.result_id;
    client.query("SELECT * FROM result WHERE result_id=$1 ",[result_id], (err, result, fields) =>{
        res.send({
            result: result});
        console.log(result);
    })
})


app.listen(process.env.PORT || PORT, () => {
    console.log('Server is running on port:' + PORT);
})
