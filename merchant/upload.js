const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名: 时间戳 + 随机数 + 原后缀
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 限制 20MB
    }
});

// 上传接口
router.post('/upload', (req, res) => {
    upload.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer 报错 (例如文件太大)
            console.error(' [Multer Error]:', err);
            return res.status(400).json({ success: false, msg: '上传失败: 文件太大 (上限 20MB)' });
        } else if (err) {
            // 其他未知报错
            console.error(' [Unknown Upload Error]:', err);
            return res.status(500).json({ success: false, msg: '上传失败: ' + err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ success: false, msg: '没有上传文件' });
            }

        // 构建返回的 URL
        // 注意：基准 URL 建议根据环境配置，这里硬编码为 3001 端口
        const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;

            res.json({
                success: true,
                msg: '上传成功',
                data: imageUrl
            });
        } catch (error) {
            console.error(' [Upload Interface Error]:', error);
            res.status(500).json({ success: false, msg: '服务器上传失败: ' + error.message });
        }
    });
});

module.exports = router;
