const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    
    const [hotelRows] = await pool.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    
    if (hotelRows.length === 0) {
      return res.status(404).json({ success: false, msg: '酒店不存在' });
    }
    
    // 取出的第一条即为酒店基础信息 (如果 DB 返回的已经是对象/数组就不需要 parse)
    const hotelBasicInfo = hotelRows[0];
    hotelBasicInfo.detail_images = typeof hotelBasicInfo.detail_images === 'string' ? JSON.parse(hotelBasicInfo.detail_images) : (hotelBasicInfo.detail_images || []);
    hotelBasicInfo.tags = typeof hotelBasicInfo.tags === 'string' ? JSON.parse(hotelBasicInfo.tags) : (hotelBasicInfo.tags || []);
    
    // 获取对应的房型信息
    const [rooms] = await pool.query('SELECT * FROM rooms WHERE hotel_id = ?', [hotelId]);
    hotelBasicInfo.rooms = rooms;

    res.json({
      success: true,
      msg: '获取酒店详情成功',
      data: hotelBasicInfo
    });
  } catch (error) {
    console.error('获取酒店详情失败:', error);
    res.status(500).json({ success: false, msg: '服务器错误' });
  }
});

module.exports = router;
