const mysql = require('mysql2');

//const connection = mysql.createConnection({
//  host: 'localhost',
//  user: 'root',
 // password: '9596802233',
 // database: 'transactions',
  //port: 3306,
  //connectionLimit: 10, 
//});
const connection = mysql.createConnection({
  host: 'sql6.freesqldatabase.com',
  user: 'sql6692051',
  password: '6IYvvjI47q',
  database: 'sql6692051',
  port: 3306,
  connectionLimit: 10, 
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

module.exports = connection;
