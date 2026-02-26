const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '116.62.19.40',     // 阿里云服务器 IP (已正确)
  port: 3306,               // MySQL 默认端口
  user: 'pc_admin',             
  password: 'root123',  
  database: 'merchant_db',  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;