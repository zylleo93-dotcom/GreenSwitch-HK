import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index.js';
import { verifyToken } from './auth.js';

const router = Router();

// 配置 multer 存储
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
    files: 10 // 最多 10 个文件
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

/**
 * 上传文件到 Firebase Storage (模拟，实际使用云存储)
 * POST /api/upload
 */
router.post('/', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { applicationId, type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileId = uuidv4();
      const fileData = {
        id: fileId,
        userId,
        applicationId: applicationId || null,
        type: type || 'general', // electricity, efficiency, oldEfficiency, financial
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        // 将文件转为 base64 存储 (仅适合小文件，大文件应使用云存储)
        data: file.buffer.toString('base64'),
        createdAt: new Date()
      };

      await db.collection('files').doc(fileId).set(fileData);
      
      uploadedFiles.push({
        id: fileId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: fileData.type
      });
    }

    res.status(201).json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

/**
 * 获取文件
 * GET /api/upload/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection('files').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: '无权访问此文件' });
    }

    // 返回 base64 数据
    res.json({
      success: true,
      data: {
        id: doc.id,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        type: data.type,
        data: data.data // base64
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: '获取文件失败' });
  }
});

/**
 * 删除文件
 * DELETE /api/upload/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection('files').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: '无权删除此文件' });
    }

    await db.collection('files').doc(id).delete();

    res.json({ success: true, message: '文件已删除' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
});

/**
 * 获取用户的所有文件
 * GET /api/upload
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { applicationId, type } = req.query;

    let query = db.collection('files').where('userId', '==', userId);

    if (applicationId) {
      query = query.where('applicationId', '==', applicationId);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      originalName: doc.data().originalName,
      mimeType: doc.data().mimeType,
      size: doc.data().size,
      type: doc.data().type,
      createdAt: doc.data().createdAt
    }));

    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

export default router;
