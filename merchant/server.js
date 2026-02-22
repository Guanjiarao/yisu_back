const express = require('express');
const cors = require('cors');
const merchantRoutes = require('./index');

const app = express();

app.use(cors());
app.use(express.json());

// ======== 专门挂载商家端测试接口 ========
app.use('/api/merchant', merchantRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Merchant 专属测试后端服务已启动: http://localhost:${PORT}`);
});
