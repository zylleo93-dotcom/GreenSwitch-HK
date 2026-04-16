import { Router } from 'express';
import { db } from '../index.js';
import { verifyToken } from './auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * 获取用户的所有申报记录
 * GET /api/applications
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = db.collection('applications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: '获取申报记录失败' });
  }
});

/**
 * 获取单个申报记录
 * GET /api/applications/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection('applications').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '申报记录不存在' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: '无权访问此记录' });
    }

    res.json({ success: true, data: { id: doc.id, ...data } });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: '获取申报记录失败' });
  }
});

/**
 * 创建新申报记录
 * POST /api/applications
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      utility,
      installationType,
      industry,
      operatingHours,
      items,
      calculations,
      status = 'draft'
    } = req.body;

    // 验证必需字段
    if (!utility || !industry || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const applicationId = uuidv4();
    const applicationData = {
      id: applicationId,
      userId,
      utility,
      installationType: installationType || 'replacement',
      industry,
      operatingHours: operatingHours || 8,
      items,
      calculations,
      status, // draft, submitted, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: status === 'submitted' ? new Date() : null
    };

    await db.collection('applications').doc(applicationId).set(applicationData);

    // 更新用户统计
    await db.collection('users').doc(userId).update({
      applicationCount: db.FieldValue?.increment(1) || 1,
      updatedAt: new Date()
    });

    res.status(201).json({ success: true, data: applicationData });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: '创建申报记录失败' });
  }
});

/**
 * 更新申报记录
 * PUT /api/applications/:id
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const updateData = req.body;

    // 检查记录是否存在且属于当前用户
    const doc = await db.collection('applications').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '申报记录不存在' });
    }

    const existingData = doc.data();
    if (existingData.userId !== userId) {
      return res.status(403).json({ error: '无权修改此记录' });
    }

    // 已提交的记录不能修改
    if (existingData.status === 'submitted') {
      return res.status(400).json({ error: '已提交的申报不能修改' });
    }

    // 更新字段
    const allowedUpdates = ['industry', 'operatingHours', 'items', 'calculations', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    updates.updatedAt = new Date();
    
    if (updateData.status === 'submitted' && existingData.status !== 'submitted') {
      updates.submittedAt = new Date();
    }

    await db.collection('applications').doc(id).update(updates);

    const updatedDoc = await db.collection('applications').doc(id).get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: '更新申报记录失败' });
  }
});

/**
 * 删除申报记录
 * DELETE /api/applications/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection('applications').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '申报记录不存在' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: '无权删除此记录' });
    }

    await db.collection('applications').doc(id).delete();

    // 更新用户统计
    await db.collection('users').doc(userId).update({
      applicationCount: db.FieldValue?.increment(-1) || 0,
      updatedAt: new Date()
    });

    res.json({ success: true, message: '申报记录已删除' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: '删除申报记录失败' });
  }
});

/**
 * 复制申报记录
 * POST /api/applications/:id/clone
 */
router.post('/:id/clone', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection('applications').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '申报记录不存在' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: '无权复制此记录' });
    }

    const newId = uuidv4();
    const clonedData = {
      ...data,
      id: newId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: null
    };

    await db.collection('applications').doc(newId).set(clonedData);

    // 更新用户统计
    await db.collection('users').doc(userId).update({
      applicationCount: db.FieldValue?.increment(1) || 1,
      updatedAt: new Date()
    });

    res.status(201).json({ success: true, data: clonedData });
  } catch (error) {
    console.error('Clone application error:', error);
    res.status(500).json({ error: '复制申报记录失败' });
  }
});

export default router;
