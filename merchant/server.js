const express = require('express');
const cors = require('cors');
const merchantRoutes = require('./index');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 静态文件服务 - 用于访问上传的图片
// 因为 server.js 在 merchant 目录下，uploads 在上一级，所以用 ../uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ======== 全局错误捕获 ========
app.use((err, req, res, next) => {
  console.error(' [Merchant Server Error]:', err);
  res.status(500).json({ success: false, msg: '服务器内部错误: ' + err.message });
});

// ======== 专门挂载商家端测试接口 ========
app.use('/api/merchant', merchantRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Merchant 专属测试后端服务已启动: http://localhost:${PORT}`);
});
