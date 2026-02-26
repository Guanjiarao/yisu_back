const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

app.use(cors());
app.use(express.json());

// 专供阿里云的完美数据库配置
const pool = mysql.createPool({
  host: '127.0.0.1', 
  port: 3306,        
  user: 'root',      
  password: 'root123', 
  database: 'merchant_db', // 👈 核心大换血：强行连接到 merchant_db 大本营！
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ 阿里云数据库连接成功！(已连接 merchant_db)');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
})();

// ==========================================
// 🛡️ 核心黑科技：全局 HTTPS 代理转换器 (本次唯一新增的武器)
// ==========================================
const convertToHttps = (url) => {
  if (!url) return url;
  // 如果是咱们阿里云的 http 图片，就给它强行加上代理马甲
  if (typeof url === 'string' && url.includes('http://116.62.19.40')) {
    return url.replace('http://116.62.19.40', 'https://wsrv.nl/?url=116.62.19.40');
  }
  return url;
};

// ================= 酒店模块 API =================

// 接口1：查询酒店列表 (🔥保留了你的高级筛选，只在最后加了马甲)
app.get('/api/hotels/search', async (req, res) => {
  try {
    // 1. 接收前端传来的所有大招参数
    const { 
      city, keyword, 
      star, min_price, max_price, 
      sort, user_lat, user_lng 
    } = req.query;
    
    // 2. 核心底线：永远只查 audit_status = 1 (审核通过) 的酒店！
    let sql = 'SELECT * FROM hotels WHERE audit_status = 1';
    const params = [];
    
    // ======== 动态拼接 WHERE 筛选条件 ========
    if (city) {
      sql += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }
    if (keyword) {
      sql += ' AND (name LIKE ? OR tags LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (star) {
      sql += ' AND star = ?';
      params.push(Number(star));
    }
    if (min_price) {
      sql += ' AND price >= ?';
      params.push(Number(min_price));
    }
    if (max_price) {
      sql += ' AND price <= ?';
      params.push(Number(max_price));
    }
    
    // ======== 动态拼接 ORDER BY 排序逻辑 ========
    if (sort === 'price_desc') {
      sql += ' ORDER BY price DESC'; 
    } else if (sort === 'price_asc') {
      sql += ' ORDER BY price ASC';  
    } else if (sort === 'distance_asc' && user_lat && user_lng) {
      sql += ' ORDER BY (POW(CAST(longitude AS DECIMAL(10,6)) - ?, 2) + POW(CAST(latitude AS DECIMAL(10,6)) - ?, 2)) ASC';
      params.push(Number(user_lng), Number(user_lat));
    } else {
      sql += ' ORDER BY id DESC';
    }

    // 3. 终极执行
    const [rows] = await pool.query(sql, params);
    
    // 👇 关键改动：给列表里所有酒店的封面图穿上马甲！
    const safeRows = rows.map(hotel => {
      hotel.cover_image = convertToHttps(hotel.cover_image);
      return hotel;
    });
    
    res.json({
      code: 200,
      data: safeRows, // 发送穿好马甲的数据
      message: 'success'
    });
  } catch (error) {
    console.error('搜索过滤报错:', error);
    res.status(500).json({ code: 500, data: null, message: '服务器错误' });
  }
});

// 接口2：查询酒店详情及房型 (🔥保留了原逻辑，给所有详情图和房型图穿马甲)
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [hotelRows] = await pool.query('SELECT * FROM hotels WHERE id = ? AND audit_status = 1', [id]);
    
    if (hotelRows.length === 0) {
      return res.status(404).json({ code: 404, message: '未找到该酒店或尚未审核通过' });
    }
    
    const [roomRows] = await pool.query('SELECT * FROM rooms WHERE hotel_id = ?', [id]);
    
    const safeParseJSON = (value, defaultValue) => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return defaultValue;
        }
      }
      return value;
    };
    
    const hotelData = hotelRows[0];
    
    let parsedImages = safeParseJSON(hotelData.detail_images, []);
    if (parsedImages.length === 0 && hotelData.cover_image) {
      parsedImages = [hotelData.cover_image];
    }
    
    // 👇 关键改动：给详情轮播图和封面图穿上马甲！
    hotelData.images = parsedImages.map(img => convertToHttps(img));
    hotelData.cover_image = convertToHttps(hotelData.cover_image);

    hotelData.facilities = safeParseJSON(hotelData.facilities, []);
    hotelData.policies = safeParseJSON(hotelData.policies, {});
    
    const rooms = roomRows.map(room => {
      room.facilities = safeParseJSON(room.facilities, []);
      // 👇 关键改动：给房型的小图穿上马甲！
      room.image = convertToHttps(room.image);
      return room;
    });
    
    hotelData.rooms = rooms;
    
    res.json({
      code: 200,
      message: 'success',
      data: hotelData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ================= 广告 Banner API (🔒100%原封不动) =================
app.get('/api/hotel/banners', async (req, res) => {
  try {
    const sslProxy = 'https://wsrv.nl/?url=';
    const mockBanners = [
      {
        id: 1,
        image_url: sslProxy + '116.62.19.40:3005/uploads/beijing_hotel.jpg',
        hotel_id: 101, 
        title: '住进云端，俯瞰京城繁华'
      },
      {
        id: 2,
        image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop',
        hotel_id: 102, 
        title: '上海百年传奇，尽享浦江风情'
      },
      {
        id: 3,
        image_url: sslProxy + '116.62.19.40:3005/uploads/hangzhou_hotel.jpg',
        hotel_id: 103, 
        title: '西湖秘境，江南园林的奢华私享'
      },
      {
        id: 4,
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
        hotel_id: 104, 
        title: '深圳之巅，体验标志性管家服务'
      },
      {
        id: 5,
        image_url:sslProxy + '116.62.19.40:3005/uploads/chengdu_hotel.jpg',
        hotel_id: 105, 
        title: '打卡太古里，品味蜀地文化底蕴'
      }
    ];

    res.json({ code: 200, message: 'success', data: mockBanners });
  } catch (error) {
    console.error('获取Banner报错:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ================= 订单模块 API (🔒100%原封不动) =================

// 接口3：创建新订单 (POST)
app.post('/api/orders', async (req, res) => {
  try {
    const { user_email, hotel_name, room_name, check_in, check_out, total_price, status = '待支付' } = req.body;
    
    const order_no = new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(1000 + Math.random() * 9000);
    
    const sql = `INSERT INTO orders (order_no, user_email, hotel_name, room_name, check_in, check_out, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [order_no, user_email, hotel_name, room_name, check_in, check_out, total_price, status]);
    
    res.json({ code: 200, message: '订单创建成功', data: { order_no } });
  } catch (error) {
    console.error('创建订单报错:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 接口4：根据邮箱获取历史订单 (GET)
app.get('/api/orders', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ code: 400, message: '必须提供用户邮箱' });
    }
    
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC', [email]);
    
    res.json({ code: 200, message: 'success', data: rows });
  } catch (error) {
    console.error('获取订单报错:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 接口5：获取单个订单详情 (GET)
app.get('/api/orders/:order_no', async (req, res) => {
  try {
    const { order_no } = req.params;
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_no = ?', [order_no]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    
    res.json({ code: 200, message: 'success', data: rows[0] });
  } catch (error) {
    console.error('获取订单详情报错:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 接口6：更新订单状态 (PUT) - 用于支付和取消
app.put('/api/orders/:order_no/status', async (req, res) => {
  try {
    const { order_no } = req.params;
    const { status } = req.body; 
    
    if (!status) {
      return res.status(400).json({ code: 400, message: '必须提供新的状态' });
    }

    const [result] = await pool.query('UPDATE orders SET status = ? WHERE order_no = ?', [status, order_no]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    
    res.json({ code: 200, message: '订单状态更新成功' });
  } catch (error) {
    console.error('更新订单状态报错:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`云端后端服务已启动: 端口 ${PORT}`);
});