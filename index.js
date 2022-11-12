const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');

const { Client } = require('pg');

const client = new Client({
    host: "wateranalyze.cxbsylbmgqtz.ap-northeast-1.rds.amazonaws.com",
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
//add result
app.post('/addresult', (req, res) => {

    const {user_id, date, time, garden_name, temperature, moisture_air, moisture_soil, rs, kc, radius,water_volume,watering,vpd,recommend,day,month} = req.body
    //console.log(user_id);
    client.query("INSERT INTO result (user_id, date, time, garden_name, temperature, moisture_air, moisture_soil, rs, kc, radius,water_volume,watering,vpd,recommend,day,month) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,$15,$16)", [user_id, date, time, garden_name, temperature, moisture_air, moisture_soil, rs, kc, radius,water_volume,watering,vpd,recommend,day,month], (err, result, fields) => {
        if (!err) {
            console.log('add success')
            res.send({ status: 'add success' });
        }else{
            console.log('add error')
            console.log(err)
        }
    })
})

//csv
app.post('/csv',async (req, res) => {
    const user_id = req.body.user_id;
    const result_id = req.body.result_id;
    
    const sqlUser = await client.query("SELECT us.title, us.first_name,us.last_name, us.email FROM users as us WHERE us.user_id = $1", [user_id]);
    //let responseUser = await connect.promiseQuery(sqlUser);
    //console.log(sqlUser.rows[0]);
    const userData = {
      title: sqlUser.rows[0].title,
      name: sqlUser.rows[0].first_name + " " + sqlUser.rows[0].last_name,
      email: sqlUser.rows[0].email,
    }
  
    const responseWater = await client.query(`SELECT rs.result_id, rs.date ,rs.time, rs.garden_name, rs.temperature,
                      rs.moisture_air,rs.moisture_soil,rs.rs,rs.kc,rs.radius,rs.water_volume,
                      rs.watering, rs.vpd, rs.recommend
                      FROM result as rs
                      WHERE rs.result_id = $1
                      ORDER BY rs.date desc, rs.time desc`,[result_id]);
    //let responseA004 = await connect.promiseQuery(sqlA004);
  
    const csvA004 = await ConvertToCSV(responseWater.rows);
  
    transport = {
      service: "gmail",
      auth: {
        user: "ferkerhik@gmail.com",
        pass: "vnjrxcslzsesmxve",
      },
    };
    const smtpTransport = nodemailer.createTransport(transport);
  
    let subject = "สรุปผลประวัติการวิเคราะห์น้ำ";
    let mailOptions = {
      from: "sender@gmail.com",
      to: `${userData.email}`,
      subject: `${subject}`,
      text: `เอกสาร${subject} \r\nจากผู้วิเคราะห์ ${userData.title} ${userData.name}\r\nอีเมล์ติดต่อ : ${userData.email}`,
      html: `<b>เอกสาร${subject} <br/>จากผู้วิเคราะห์ ${userData.title} ${userData.name}<br/>อีเมล์ติดต่อ : ${userData.email}</b>`,
      attachments: [
        {
          filename: `ปริมาณน้ำ.csv`,
          content: csvA004,
          contentType: 'text/csv; charset=utf-8'
        },
      ],
    };
    smtpTransport.sendMail(mailOptions, function (err, info) {
      if (err) console.log(err);
      else {
        console.log("send csv");
        res.status(200).json("Send Email Complete")};
    });
  })

//ConvertToCSV
async function ConvertToCSV(objArray) {
    let newObj = objArray;
    // console.log(objArray)
    if (objArray.length == 0) {
      console.log("objarray == 0");
      const csvString = [
        ["วันที่", "เวลา", "ธาตุอาหาร", "คำแนะนำ"],
        ["", "", "", ""]
      ]
        .map((e) => e.join(","))
        .join("\n");
  
      // console.log(csvString);
      return csvString;
    }
    else {
      console.log("objarray > 0");
      //console.log(objArray);
      let current_date = "", current_time = ""
      objArray.map((item, index) => {
        let newDetail = newObj;
        let date = "", time = ""
        if (item.date != current_date || item.time != current_time) {
          date = item.date
          current_date = item.date
          time = item.time
          current_time = item.time
        }
        let new_kc = newDetail[index].kc;
        if(new_kc=='1'){
            new_kc = 'ระยะกิ่ง ก้าน ใบ';
        }
        else if(new_kc == '2'){
            new_kc = 'ระยะชักนำดอก';
        }
        else if(new_kc == '3'){
            new_kc = 'ระยะออกดอก';
        }
        else if(new_kc == '4'){
            new_kc = 'ระยะติดผล';
        }
        else if(new_kc == '5'){
            new_kc = 'ระยะผลอ่อน';
        }
        else if(new_kc == '6'){
            new_kc = 'ระยะพัฒนาของผล';
        }
        else if(new_kc == '7'){
            new_kc = 'ระยะเริ่มแก่-ก่อนเก็บเกี่ยว';
        }
        let new_radius = newDetail[index].radius;
        if(new_radius == '1'){
            new_radius = '0.5 เมตร';
        }
        else if(new_radius == '2'){
            new_radius = '1.0 เมตร';
        }
        else if(new_radius == '3'){
            new_radius = '1.5 เมตร';
        }
        else if(new_radius == '4'){
            new_radius = '2.0 เมตร';
        }
        else if(new_radius == '5'){
            new_radius = '2.5 เมตร';
        }
        else if(new_radius == '6'){
            new_radius = '3.0 เมตร';
        }
        else if(new_radius == '7'){
            new_radius = '3.5 เมตร';
        }
        else if(new_radius == '8'){
            new_radius = '4.0 เมตร';
        }
        else if(new_radius == '9'){
            new_radius = '4.5 เมตร';
        }
        else if(new_radius == '10'){
            new_radius = '5.0 เมตร';
        }
        let new_recommend = newDetail[index].recommend;
        new_recommend = new_recommend.split("\n").join("\t");
        new_recommend = new_recommend.split(",").join(" ");
        newDetail[index] = {
          ...newDetail[index],
          recommend: new_recommend,
          kc:new_kc,
          radius:new_radius,
          date: date,
          time: time
        };
        newObj = newDetail;
      });
        const csvString = [
          ["วันที่", "เวลา", "ชื่อสวน", "อุณหภูมิ", "ความชื้นในอากาศ", "ความชื้นในดิน", "ความเข้มของแสง", "ระยะการเจริญเติบโต", "รัศมีทรงพุ่ม", "ปริมาณน้ำจากหัวจ่ายน้ำ","ปริมาณน้ำ / ต้น", "ความแห้งของอากาศ", "คำแนะนำเพิ่มเติม"],
          ...newObj.map((item) => [
            item.date, item.time,item.garden_name,
            `${item.temperature} °C`,
            `${item.moisture_air} %`,
            `${item.moisture_soil} %`,
            `${item.rs} Lux`,
            `${item.kc} `,
            `${item.radius} `,
            `${item.water_volume} ลิตร / ชม.`,
            `${item.watering} ลิตร`,
            `${item.vpd} Kpa`,
            item.recommend,
          ]),
        ]
          .map((e) => e.join(","))
          .join("\n");
        // console.log(csvString);
        return csvString;
    }
 }


//csvAll
app.post('/csvAll',async (req, res) => {
    const user_id = req.body.user_id;
    const fromDate = req.body.fromDate;
    const toDate = req.body.toDate;

    const sqlUser = await client.query("SELECT us.title, us.first_name,us.last_name, us.email FROM users as us WHERE us.user_id = $1", [user_id]);
    //let responseUser = await connect.promiseQuery(sqlUser);
    console.log(sqlUser.rows[0]);
    const userData = {
      title: sqlUser.rows[0].title,
      name: sqlUser.rows[0].first_name + " " + sqlUser.rows[0].last_name,
      email: sqlUser.rows[0].email,
    }
  
    const responseWater = await client.query(`SELECT rs.result_id, rs.date, rs.time,rs.garden_name, rs.watering, rs.vpd, rs.recommend
                      FROM result as rs
                      WHERE rs.user_id = $1 AND rs.date >= $2 AND rs.date <= $3
                      ORDER BY rs.date desc, rs.time desc`,[user_id,fromDate,toDate]);
    //let responseA004 = await connect.promiseQuery(sqlA004);
  
    const csvA004 = await ConvertToCSVAll(responseWater.rows);
  
    transport = {
      service: "gmail",
      auth: {
        user: "ferkerhik@gmail.com",
        pass: "vnjrxcslzsesmxve",
      },
    };
    const smtpTransport = nodemailer.createTransport(transport);
  
    let subject = "สรุปผลประวัติการวิเคราะห์";
    let mailOptions = {
      from: "sender@gmail.com",
      to: `${userData.email}`,
      subject: `${subject}`,
      text: `เอกสาร${subject} \r\nจากผู้วิเคราะห์ ${userData.title} ${userData.name}\r\nอีเมล์ติดต่อ : ${userData.email}`,
      html: `<b>เอกสาร${subject} <br/>จากผู้วิเคราะห์ ${userData.title} ${userData.name}<br/>อีเมล์ติดต่อ : ${userData.email}</b>`,
      attachments: [
        {
          filename: `ปริมาณน้ำ.csv`,
          content: csvA004,
          contentType: 'text/csv; charset=utf-8'
        },
      ],
    };
    smtpTransport.sendMail(mailOptions, function (err, info) {
      if (err) console.log(err);
      else {
        console.log("send csv");
        res.status(200).json("Send Email Complete")};
    });
  })

//ConvertToCSVAll
async function ConvertToCSVAll(objArray) {
    let newObj = objArray;
    // console.log(objArray)
    if (objArray.length == 0) {
      console.log("objarray == 0");
      const csvString = [
        ["วันที่", "เวลา", "ธาตุอาหาร", "คำแนะนำ"],
        ["", "", "", ""]
      ]
        .map((e) => e.join(","))
        .join("\n");
  
      // console.log(csvString);
      return csvString;
    }
    else {
      console.log("objarray > 0");
      //console.log(objArray);
      let current_date = "", current_time = ""
      objArray.map((item, index) => {
        let newDetail = newObj;
        let date = "", time = ""
        if (item.date != current_date || item.time != current_time) {
          date = item.date
          current_date = item.date
          time = item.time
          current_time = item.time
        }
        let new_recommend = newDetail[index].recommend;
        new_recommend = new_recommend.split("\n").join("\t");
        new_recommend = new_recommend.split(",").join(" ");
        newDetail[index] = {
          ...newDetail[index],
          recommend: new_recommend,
          date: date,
          time: time
        };
        newObj = newDetail;
      });
        const csvString = [
          ["วันที่", "เวลา","ชื่อสวน", "ปริมาณน้ำ / ต้น", "ความแห้งของอากาศ", "คำแนะนำเพิ่มเติม"],
          ...newObj.map((item) => [
            item.date, item.time,item.garden_name,
            `${item.watering} ลิตร`,
            `${item.vpd} Kpa`,
            item.recommend,
          ]),
        ]
          .map((e) => e.join(","))
          .join("\n");
        // console.log(csvString);
        return csvString;
    }
 }

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

//delete garden
app.post('/deletegarden', (req, res) => {

    const garden_id = req.body.garden_id
    console.log(garden_id);
    client.query("DELETE FROM address WHERE id = $1", [garden_id], (err, result, fields) => {
        if (!err) {
            console.log('delete success')
            res.send({ status: 'delete success' });
        }else{
            console.log('delete error')
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

// checkemail
app.post('/checkemail', (req,res) => {

    const email = req.body.email;
    console.log(email);
    client.query("SELECT email from users WHERE email=$1", [email], (err,result,fields) =>{
        console.log(result);
        if (result.rowCount>0) {
            console.log('success')
            res.send({ status: true });
        }else{
            res.send({ status: false });
            console.log(err)
        }
    })
})

//forgotpassword
app.post('/forgotpassword', (req,res) => {
    const passgen = genPassword(5)
    const email = req.body.email;
    console.log(passgen);
    console.log(email);
//     client.query("SELECT * WHERE email = $1", [email], (err, result, fields) =>{
//       console.log(result);  
//     })
    client.query("UPDATE users SET password = $1 WHERE email = $2", [passgen,email], (err, result, fields) =>{
        console.log(result);
        if (!err) {
            console.log('success')
            res.send({ status: true });
        }else{
            res.send({ status: false });
            console.log(err)
            console.log('fail')
        }
    })

    const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ferkerhik@gmail.com",
          pass: "vnjrxcslzsesmxve",
        }
    });

    let mailOptions = {
        from: "sender@gmail.com",
        to: `${email}`,
        subject: "ข้อความแจ้งเตือนการเปลี่ยนรหัสผ่าน",
        text: `ข้อความแจ้งเตือนการเปลี่ยนรหัสผ่าน`,
        html: `<b>คุณได้ทำการแก้ไขรหัสผ่าน ผ่านฟังก์ชันลืมรหัสผ่าน<br/>โดยรหัสผ่านใหม่ที่คุณได้รับ คือ ${passgen}</b>`,
    };

    smtpTransport.sendMail(mailOptions, function (err, info) {
        if (err) console.log(err);
        else {
            console.log("finish");
            res.send("Send Email Complete")
        };
    });
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
    client.query("SELECT * FROM address WHERE user_id=$1 ",[user_id], (err, result, fields) =>{
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
app.post('/changepassword', (req,res) => {
    
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
        console.log
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

app.post('/gettotalWater', (req, res) => {
    const user_id = req.body.user_id;
    const month = req.body.month;
    client.query("SELECT watering AND day FROM result WHERE month=$1 AND user_id=$2 ",[month,user_id], (err, result, fields) =>{
        if (!err) {
            console.log('success')
            res.send({result: result});
        }else{
            console.log(err)
        }
    })
})

function genPassword(length) {
    var result = [];
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result.push(
        characters.charAt(Math.floor(Math.random() * charactersLength))
      );
    }
    return result.join("");
}


app.listen(process.env.PORT || PORT, () => {
    console.log('Server is running on port:' + PORT);
})
