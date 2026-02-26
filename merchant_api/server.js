const express = require('express');
const cors = require('cors');
const merchantRoutes = require('./index');
const adminRoutes = require('./admin'); // 👉 1. 新增：引入刚才写好的 admin 路由文件
const path = require('path');

const app = express();

// 1. 基础中间件
app.use(cors());
app.use(express.json());

// 2. 静态文件服务 - 用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. 挂载业务路由 (⚠️必须放在错误拦截之前！)
app.use('/api/merchant', merchantRoutes); // 商家端业务
app.use('/api/admin', adminRoutes);       // 👉 2. 新增：挂载 Admin 管理员业务

// 4. 全局错误捕获 (⚠️必须放在所有路由的最底下！)
app.use((err, req, res, next) => {
  console.error('❌ [Server Error]:', err);
  res.status(500).json({ success: false, msg: '服务器内部错误: ' + err.message });
});

// 5. 启动服务与守护进程
const PORT = 3005;
const server = app.listen(PORT, () => {
  // 👉 提示语升级为双核
  console.log(`✅ Merchant & Admin 双核后端已稳定运行: http://localhost:${PORT}`);
  console.log(`⌛ 正在持续监听请求中，请勿关闭本窗口...`);
});

// 6. 捕捉可能导致秒退的致命错误
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`💥 致命错误: 端口 ${PORT} 已经被占用了！请检查是否开启了其他后端服务。`);
  } else {
    console.error('💥 致命错误: 服务器启动失败 ->', err);
  }
});