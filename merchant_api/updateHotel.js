const express = require('express');
const router = express.Router();
const pool = require('./db');

router.put('/hotels/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const hotelId = req.params.id;
    // 👇 1. 增加接收 city 和 facilities 字段
    const {
      name, english_name, address, longitude, latitude, star, description, 
      cover_image, detail_images, open_date, tags, rooms, city, facilities
    } = req.body;
    
    // 👇 2. 核心数据安全处理
    const cityStr = city || '';
    const facilitiesStr = Array.isArray(facilities) ? JSON.stringify(facilities) : (facilities || '[]');

    await connection.beginTransaction();
    
    // 👇 3. 更新酒店信息 (SQL 和 参数里加上 city 和 facilities)
    // 如果被驳回，更新后重新变为待审核 pending。这里我们直接设置为 pending，也可以根据原状态处理。
    await connection.query(
      `UPDATE hotels SET 
        name = ?, english_name = ?, address = ?, longitude = ?, latitude = ?, star = ?, description = ?, 
        cover_image = ?, detail_images = ?, open_date = ?, tags = ?, status = 'pending', city = ?, facilities = ?
      WHERE id = ?`,
      [
        name, 
        english_name || '', 
        address, 
        longitude || null,
        latitude || null,
        star, 
        description || '', 
        cover_image, 
        JSON.stringify(detail_images || []), 
        open_date, 
        JSON.stringify(tags || []),
        cityStr,       // 👈 新增
        facilitiesStr, // 👈 新增
        hotelId
      ]
    );

    let minPrice = 0;
    
    // 房型更新
    if (rooms && rooms.length > 0) {
      minPrice = Math.min(...rooms.map(r => Number(r.price)));
      
      // 找出当前传过来的带有 ID 的房间，意味着这些是原本存在的需要更新的，没带 ID 的是新增的
      const currentRoomIds = rooms.filter(r => r.id).map(r => r.id);
      
      // 删除不在 currentRoomIds 里面（被用户删除了的房间）的已有房间
      if (currentRoomIds.length > 0) {
          await connection.query('DELETE FROM rooms WHERE hotel_id = ? AND id NOT IN (?)', [hotelId, currentRoomIds]);
      } else {
          // 如果列表全是不带 ID 的（全是新房型），那就直接删掉原来所有的
          await connection.query('DELETE FROM rooms WHERE hotel_id = ?', [hotelId]);
      }

      for (const room of rooms) {
        if (room.id) {
          // 更新已有房型
          await connection.query(
            `UPDATE rooms SET name=?, area=?, bed_info=?, price=?, stock=?, image=? WHERE id=? AND hotel_id=?`,
            [room.name, room.area, room.bed_info, room.price, room.stock, room.image || '', room.id, hotelId]
          );
        } else {
          // 插入新房型
          await connection.query(
            `INSERT INTO rooms (hotel_id, name, area, bed_info, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [hotelId, room.name, room.area, room.bed_info, room.price, room.stock, room.image || '']
          );
        }
      }
    } else {
        // 无房型的时候清空所有旧房型
        await connection.query('DELETE FROM rooms WHERE hotel_id = ?', [hotelId]);
    }
    
    // 更新酒店的最低价格
    await connection.query('UPDATE hotels SET price = ? WHERE id = ?', [minPrice, hotelId]);

    await connection.commit();
    res.json({ success: true, msg: '编辑酒店成功' });
    
  } catch (error) {
    await connection.rollback();
    console.error('编辑酒店失败:', error);
    res.status(500).json({ success: false, msg: '服务器错误: ' + error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;