const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/hotels', async (req, res) => {
  try {
    const role = req.query.role || req.headers.role;
    const userId = req.query.userId || req.query.owner_id || req.headers.userid;

    let sql = '';
    const params = [];

    if (role === 'admin') {
      sql = 'SELECT * FROM hotels ORDER BY id DESC';
    } else if (role === 'merchant') {
      if (!userId) {
        return res.json({ success: false, msg: '未获取到商户身份ID', data: [] });
      }
      sql = 'SELECT * FROM hotels WHERE owner_id = ? ORDER BY id DESC';
      params.push(Number(userId));
    } else {
      const fallbackId = userId ? Number(userId) : 101;
      sql = 'SELECT * FROM hotels WHERE owner_id = ? ORDER BY id DESC';
      params.push(fallbackId);
    }
    
    const [rows] = await pool.query(sql, params);
    
    // 👇 4. 格式化输出数据结构（核心修复：加上状态翻译）
    const formattedData = rows.map(hotel => {
      // 先翻译状态
      let statusStr = 'pending'; // 默认待审核
      if (hotel.audit_status === 1) statusStr = 'published';
      if (hotel.audit_status === 2) statusStr = 'rejected';
      if (hotel.audit_status === 3) statusStr = 'offline';

      return {
        ...hotel,
        status: statusStr, // 👈 强行追加前端能看懂的 status 字段
        detail_images: typeof hotel.detail_images === 'string' ? JSON.parse(hotel.detail_images) : (hotel.detail_images || []),
        tags: typeof hotel.tags === 'string' ? JSON.parse(hotel.tags) : (hotel.tags || []) 
      };
    });

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