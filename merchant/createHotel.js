const express = require('express');
const router = express.Router();
const pool = require('./db');

router.post('/hotels', async (req, res) => {
  const connection = await pool.getConnection(); // 开启事务连接
  try {
    const {
      name, english_name, address, longitude, latitude, star, description, 
      cover_image, detail_images, open_date, tags, rooms
    } = req.body;
    
    // 模拟 merchant ID (后续从token解析)
    const owner_id = 101;
    // status default pending
    const status = 'pending';
    const score = 0; // default 0
    
    await connection.beginTransaction();
    
    // 插入酒店基础信息
    const [hotelResult] = await connection.query(
      `INSERT INTO hotels 
      (owner_id, name, english_name, address, longitude, latitude, star, status, score, description, cover_image, detail_images, open_date, tags) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id, 
        name, 
        english_name, 
        address, 
        longitude || null,
        latitude || null,
        star, 
        status, 
        score, 
        description || '', 
        cover_image, 
        JSON.stringify(detail_images || []), 
        open_date, 
        JSON.stringify(tags || [])
      ]
    );
    
    const hotelId = hotelResult.insertId;
    let minPrice = 0;
    
    // 插入房间信息
    if (rooms && rooms.length > 0) {
      minPrice = Math.min(...rooms.map(r => Number(r.price)));
      
      const roomValues = rooms.map(room => [
        hotelId, room.name, room.area, room.bed_info, room.price, room.stock, room.image || ''
      ]);
      
      await connection.query(
        `INSERT INTO rooms (hotel_id, name, area, bed_info, price, stock, image) VALUES ?`,
        [roomValues]
      );
    }
    
    // 更新酒店的最低价格冗余字段
    await connection.query('UPDATE hotels SET price = ? WHERE id = ?', [minPrice, hotelId]);
    
    await connection.commit();
    res.json({ success: true, msg: '新增酒店成功', data: { id: hotelId } });
    
  } catch (error) {
    await connection.rollback();
    console.error('新增酒店失败:', error);
    res.status(500).json({ success: false, msg: '服务器错误: ' + error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
