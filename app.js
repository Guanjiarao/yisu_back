const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1', // 👈 核心：连本地的地道入口
  port: 3306,       // 👈 核心：走我们刚设置的 33060 端口
  user: 'root',      
  password: 'root123', // 填你在 Navicat 常规标签里那个数据库密码
  database: 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ 阿里云数据库连接成功！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
})();

app.get('/api/hotels/search', async (req, res) => {
  try {
    const { city, keyword } = req.query;
    
    let sql = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];
    
    if (city) {
      sql += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR tags LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const [rows] = await pool.query(sql, params);
    
    res.json({
      code: 200,
      data: rows,
      message: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '服务器错误'
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`本地开发后端服务已启动: http://localhost:${PORT}`);
});
