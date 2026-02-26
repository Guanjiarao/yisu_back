const express = require('express');
const router = express.Router();
const pool = require('./db');

router.delete('/hotels/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const hotelId = req.params.id;
    
    // 👇 1. 极其安全的动态获取真实 owner_id 的写法
    const owner_id = (req.query && req.query.owner_id) || (req.body && req.body.owner_id);

    // 👇 2. 防呆拦截：如果没传商户 ID，直接打回
    if (!owner_id) {
      return res.status(400).json({ success: false, msg: '操作失败：未获取到当前商户身份 (缺少 owner_id)' });
    }

    // 校验是否是当前商家的酒店
    const [checkResult] = await pool.query('SELECT 1 FROM hotels WHERE id = ? AND owner_id = ?', [hotelId, owner_id]);
    
    if (checkResult.length === 0) {
      return res.status(403).json({ success: false, msg: '权限不足或该酒店不存在' });
    }
    
    await connection.beginTransaction();
    
    // 级联删除相关房型
    await connection.query('DELETE FROM rooms WHERE hotel_id = ?', [hotelId]);
    
    // 删除酒店
    await connection.query('DELETE FROM hotels WHERE id = ?', [hotelId]);
    
    await connection.commit();
    res.json({ success: true, msg: '删除成功' });
    
  } catch (error) {
    await connection.rollback();
    console.error('删除酒店失败:', error);
    res.status(500).json({ success: false, msg: '服务器错误' });
  } finally {
    connection.release();
  }
});

module.exports = router;