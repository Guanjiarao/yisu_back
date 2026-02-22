const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost', // 本地数据库
  port: 3306,       // MySQL 默认端口 3306
  user: 'root',      
  password: '20060712vV!', // 填你在 Navicat 常规标签里那个数据库密码
  database: 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
