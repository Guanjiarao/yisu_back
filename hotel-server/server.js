const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. 数据库连接 (保持不变)
// ==========================================
const db = mysql.createPool({
  host: '127.0.0.1', 
  user: 'root',
  password: 'root123', // ⚠️ 确认你的密码
  database: 'merchant_db'
});

// 健康检查：确保连上了
db.getConnection((err, conn) => {
  if (err) console.error('❌ 数据库连接失败:', err.message);
  else {
    console.log('✅ 数据库连接成功');
    conn.release();
  }
});

// ==========================================
// 2. 通用注册接口 (保持不变)
// ==========================================
app.post('/api/user/register', (req, res) => {
  console.log('👀 收到注册请求:', req.body);

  // 1. 获取参数：现在允许前端传 role 进来了
  // name: 昵称, email: 账号, password: 密码, role: 角色标识
  const { name, email, password, role } = req.body;

  if (!email || !password) {
    return res.json({ success: false, msg: '邮箱或密码缺失' });
  }

  // 2. 角色安全校验 (防止乱传)
  const validRoles = ['user', 'merchant', 'admin'];
   
  // 3. 决定最终角色
  let finalRole = 'user';
  if (role && validRoles.includes(role)) {
    finalRole = role;
  }

  // 4. 决定用户名
  const finalUsername = name || '新用户';

  // 5. 插入数据库
  const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
   
  db.query(sql, [finalUsername, email, password, finalRole], (err, result) => {
    if (err) {
      console.error('❌ 插入失败:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.json({ success: false, msg: '该邮箱已被注册' });
      }
      return res.json({ success: false, msg: '数据库错误: ' + err.sqlMessage });
    }
    
    console.log(`🎉 [${finalRole}] 注册成功，ID:`, result.insertId);
    res.json({ success: true, msg: '注册成功', role: finalRole });
  });
});

// ==========================================
// 3. 通用登录接口 (保持不变)
// ==========================================
app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;
   
  // 1. 查有没有这个人
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.json({ success: false, msg: '数据库查询出错' });
    if (results.length === 0) return res.json({ success: false, msg: '用户不存在' });
    
    const user = results[0];

    // 2. 比对密码
    if (password !== user.password) {
      return res.json({ success: false, msg: '密码错误' });
    }
    
    // 3. 生成 Token (把角色信息 role 塞进 token 里)
    // ⚠️ 注意：这里用的密钥是 'secret_key'，下面获取信息时也必须用这个
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.username }, 
      'secret_key', 
      { expiresIn: '7d' }
    );

    console.log(`✅ [${user.role}] 用户登录成功: ${user.username}`);

    // 4. 返回给前端
    res.json({ 
      success: true, 
      msg: '登录成功',
      data: { 
        token, 
        role: user.role,       // 关键：前端要靠这个跳转页面
        username: user.username,
        id: user.id
      } 
    });
  });
});

// ==========================================
// 4. 🆕 新增接口：根据 Token 获取用户信息 (用于自动登录)
// ==========================================
app.get('/api/user/info', (req, res) => {
  // 1. 获取请求头里的 Authorization
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.json({ success: false, msg: '未提供 Token' });
  }

  // 2. 提取 Token (前端通常传 "Bearer xxxxxxx")
  const token = authHeader.split(' ')[1]; 
  
  if (!token) {
    return res.json({ success: false, msg: 'Token 格式错误' });
  }

  // 3. 验证 Token
  // ⚠️ 这里的密钥必须和登录接口里的 'secret_key' 一模一样
  jwt.verify(token, 'secret_key', (err, decoded) => {
    if (err) {
      return res.json({ success: false, msg: 'Token 无效或已过期' });
    }

    // 4. 验证成功，返回用户信息
    // decoded 就是登录时存进去的 { id, role, name }
    console.log('🔄 自动登录验证通过:', decoded.name);
    
    res.json({
      success: true,
      msg: '获取成功',
      data: {
        id: decoded.id,
        username: decoded.name, // 注意：登录存的是 name
        role: decoded.role,
        // 给个默认头像，显得功能很完善
        avatar: 'https://img.yzcdn.cn/vant/cat.jpeg' 
      }
    });
  });
});

// ==========================================
// 5. 启动服务 (保持不变)
// ==========================================
app.listen(3001, '0.0.0.0', () => {
  console.log('--------------------------------------');
  console.log('🚀 服务已启动: http://0.0.0.0:3001');
  console.log('👉 小程序注册默认角色: user');
  console.log('👉 PC端注册请传参: role: "merchant"');
  console.log('👉 新增接口: GET /api/user/info');
  console.log('--------------------------------------');
});