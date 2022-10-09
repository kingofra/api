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

// app.get('/ping', (req, res) => {
//     res.send('pong')
// })

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

    const userid = req.body.userid;
    console.log(userid);
    client.query("SELECT id FROM address WHERE userid=$1 ",[userid], (err, result, fields) =>{
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

app.listen('3001', () => {
    console.log('Server is running on port 3001');
})