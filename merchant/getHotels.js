const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/hotels', async (req, res) => {
  try {
    // 101 为模拟的商家 owner_id，后续应通过鉴权 Token 解析获得
    const owner_id = 101; 
    
    const [rows] = await pool.query('SELECT * FROM hotels WHERE owner_id = ? ORDER BY id DESC', [owner_id]);
    
    // 格式化输出数据结构 (如果 DB 返回的已经是对象/数组就不需要 parse)
    const formattedData = rows.map(hotel => ({
      ...hotel,
      detail_images: typeof hotel.detail_images === 'string' ? JSON.parse(hotel.detail_images) : (hotel.detail_images || []),
      tags: typeof hotel.tags === 'string' ? JSON.parse(hotel.tags) : (hotel.tags || []) 
    }));

    res.json({
      success: true,
      msg: '获取列表成功',
      data: formattedData
    });
  } catch (error) {
    console.error('获取商户酒店列表失败:', error);
    res.status(500).json({ success: false, msg: '服务器错误: ' + error.message, stack: error.stack });
  }
});

module.exports = router;
