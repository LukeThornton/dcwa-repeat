//package
const mysql = require('mysql2/promise');

//connect to sql
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // ← change if you set a MySQL password/user
  password: 'Corrib14',      // ← change if needed
  database: 'proj2024mysql',
});

//export sql pool
module.exports = pool;
