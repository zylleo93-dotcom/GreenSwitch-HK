import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../index.js';

const router = Router();

/**
 * 验证 Firebase Token 中间件
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // 创建新用户记录
      const newUser = {
        uid: userId,
        email: req.user.email,
        displayName: req.user.name || req.user.email?.split('@')[0] || '',
        photoURL: req.user.picture || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationCount: 0,
        totalSavedEnergy: 0,
        totalSubsidy: 0
      };
      await db.collection('users').doc(userId).set(newUser);
      return res.json({ success: true, data: newUser });
    }

    res.json({ success: true, data: userDoc.data() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 更新用户信息
 * PUT /api/auth/me
 */
router.put('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, companyName, phone, address } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    await db.collection('users').doc(userId).update(updateData);

    const updatedDoc = await db.collection('users').doc(userId).get();
    res.json({ success: true, data: updatedDoc.data() });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

/**
 * 删除用户账户
 * DELETE /api/auth/me
 */
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // 删除用户数据
    await db.collection('users').doc(userId).delete();
    
    // 删除用户的申报记录
    const applicationsSnapshot = await db.collection('applications')
      .where('userId', '==', userId)
      .get();
    
    const batch = db.batch();
    applicationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 删除 Firebase Auth 用户
    await getAuth().deleteUser(userId);

    res.json({ success: true, message: '账户已删除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '删除账户失败' });
  }
});

export default router;
