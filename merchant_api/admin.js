const express = require('express');
const router = express.Router();
// 引入你原本的数据库连接池
const db = require('./db'); 

// ==========================================
// 接口 1：获取酒店列表（支持多条件动态筛选）
// GET /api/admin/hotels/pending  👈 名字还是你原来的！
// ==========================================
router.get('/hotels/pending', async (req, res) => {
    try {
        console.log('🚀🚀🚀 注意！最新版加了 S 的 admin 代码正在运行！🚀🚀🚀');
        const { hotelName, merchantName, status, city } = req.query;

        // 🌟 核心修复 1：使用 LEFT JOIN 连表，通过 owner_id 关联 user 表获取 username
        let sql = `
            SELECT h.*, u.username AS merchant_name 
            FROM hotels h 
            LEFT JOIN users u ON h.owner_id = u.id 
            WHERE 1=1
        `;
        const queryParams = [];

        // 1. 模糊查询酒店名 (加上表别名 h.)
        if (hotelName) {
            sql += ' AND h.name LIKE ?'; 
            queryParams.push(`%${hotelName}%`);
        }
        
        // 🌟 核心修复 2：模糊查询商户名 (去 user 表的 username 里查)
        if (merchantName) {
            sql += ' AND u.username LIKE ?'; 
            queryParams.push(`%${merchantName}%`);
        }
        
        // 3. 模糊查询城市
        if (city) {
            sql += ' AND h.city LIKE ?'; 
            queryParams.push(`%${city}%`);
        }
        
        // 4. 精确查询状态：把前端传来的英文，翻译成数据库的数字
        if (status !== undefined && status !== '') {
            sql += ' AND h.audit_status = ?';
            const statusMap = {
                'pending': 0,
                'published': 1,
                'rejected': 2,
                'offline': 3
            };
            const finalStatus = statusMap[status] !== undefined ? statusMap[status] : Number(status);
            queryParams.push(finalStatus); 
        }

        sql += ' ORDER BY h.id DESC';

        // 执行查询
        const [results] = await db.query(sql, queryParams);

        // 🌟 核心修复 3：把数据库查出来的数字，翻译回前端需要的英文 status
        const formattedResults = results.map(hotel => {
            let statusStr = 'pending'; // 默认状态
            if (hotel.audit_status === 1) statusStr = 'published';
            if (hotel.audit_status === 2) statusStr = 'rejected';
            if (hotel.audit_status === 3) statusStr = 'offline';
            
            return {
                ...hotel,
                status: statusStr // 强制覆盖 status 字段，让前端正确渲染颜色和文字
            };
        });

        res.json({
            success: true,
            msg: '获取酒店列表成功',
            data: formattedResults // 返回翻译后的数据
        });
    } catch (err) {
        console.error('❌ [Admin Get Hotels Pending Error]:', err);
        res.status(500).json({ success: false, msg: '获取列表失败: ' + err.message });
    }
});

// ==========================================
// 接口 2：审核酒店（通过 / 驳回）
// PUT /api/admin/hotels/:id/audit
// ==========================================
router.put('/hotels/:id/audit', async (req, res) => {
    try {
        const hotelId = req.params.id;
        const { status } = req.body; // 前端传过来 1(通过) 或 2(驳回)

        // 安全校验
        if (status !== 1 && status !== 2) {
            return res.status(400).json({ success: false, msg: '非法的审核状态' });
        }

        // 更新该酒店的状态
        const sql = 'UPDATE hotels SET audit_status = ? WHERE id = ?';
        
        // 使用最新的 await 语法
        const [result] = await db.query(sql, [status, hotelId]);
        
        if (result.affectedRows > 0) {
            res.json({ 
                success: true, 
                msg: status === 1 ? '🎉 审核已通过！小程序端现在可见了！' : '酒店已被驳回！' 
            });
        } else {
            res.status(404).json({ success: false, msg: '找不到该酒店' });
        }
    } catch (err) {
        console.error('❌ [Admin Audit Error]:', err);
        res.status(500).json({ success: false, msg: '审核操作失败: ' + err.message });
    }
});

module.exports = router;