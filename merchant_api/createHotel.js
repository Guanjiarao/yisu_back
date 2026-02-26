const express = require('express');
const router = express.Router();
const pool = require('./db');

router.post('/hotels', async (req, res) => {
  const connection = await pool.getConnection(); // 开启事务连接
  try {
    // 👇 1. 新增接收 owner_id 字段
    const {
      name, english_name, address, longitude, latitude, star, description, 
      cover_image, detail_images, open_date, tags, rooms, city, facilities,
      owner_id // 👈 这里！从前端请求体中获取真实的商户 ID
    } = req.body;
    
    // 👇 2. 强力防呆：如果前端没传商户 ID，直接拦截并报错！
    if (!owner_id) {
        return res.status(400).json({ success: false, msg: '创建失败：未获取到当前登录商户的身份信息 (缺少 owner_id)' });
    }

    const cityStr = city || '';
    const facilitiesStr = Array.isArray(facilities) ? JSON.stringify(facilities) : (facilities || '[]');

    // ❌ 删掉了这里害人的 const owner_id = 101;

    // status default pending
    const status = 'pending';
    const score = 0; // default 0
    
    await connection.beginTransaction();
    
    // 👇 3. 插入酒店基础信息 (这里的 owner_id 现在是前端传过来的真实 ID 了)
    const [hotelResult] = await connection.query(
      `INSERT INTO hotels 
      (owner_id, name, english_name, address, longitude, latitude, star, status, score, description, cover_image, detail_images, open_date, tags, city, facilities) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        JSON.stringify(tags || []),
        cityStr,       
        facilitiesStr  
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