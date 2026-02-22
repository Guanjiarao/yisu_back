const express = require('express');
const router = express.Router();
const pool = require('./db');

router.delete('/hotels/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const hotelId = req.params.id;
    // 模拟的商家 owner_id
    const owner_id = 101; 

    // 校验是否是当前商家的酒店
    const [checkResult] = await pool.query('SELECT 1 FROM hotels WHERE id = ? AND owner_id = ?', [hotelId, owner_id]);
    
    if (checkResult.length === 0) {
      return res.status(403).json({ success: false, msg: '权限不足或酒店不存在' });
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
