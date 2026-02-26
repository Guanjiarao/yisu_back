const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, 'uploads');
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
        const imageUrl = `http://116.62.19.40:3005/uploads/${req.file.filename}`;

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

// 删除图片接口
router.delete('/upload', (req, res) => {
    // 从前端发来的请求体中获取要删除的图片链接
    const { imageUrl } = req.body; 

    if (!imageUrl) {
        return res.status(400).json({ success: false, msg: '未提供图片链接' });
    }

    try {
        // 提取真正的文件名：把 "http://116.62.19.40:3005/uploads/123.png" 劈开，只要最后的 "123.png"
        const filename = imageUrl.split('/uploads/').pop();
        // 拼出它在服务器上的物理绝对路径
        const filePath = path.join(uploadDir, filename);

        // 检查文件是否存在，存在就物理删除
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, msg: '图片物理删除成功' });
        } else {
            // 文件不存在也返回成功（可能是之前已经被删过了）
            res.json({ success: true, msg: '文件已被清理' });
        }
    } catch (error) {
        console.error(' [Delete Image Error]:', error);
        res.status(500).json({ success: false, msg: '服务器删除图片失败: ' + error.message });
    }
});
module.exports = router;
