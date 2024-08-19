import mysql from "mysql"; 

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
  });
  
  con.connect((err) => {
    if (err) throw err;
    else console.log("Connected!");
  });
  