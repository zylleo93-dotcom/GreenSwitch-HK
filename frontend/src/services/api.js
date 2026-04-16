/**
 * GreenSwitch API Service
 * 封装所有后端 API 调用
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 获取认证令牌
 */
const getAuthToken = async () => {
  // 从 Firebase Auth 获取当前用户令牌
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('用户未登录');
  }
  
  return await user.getIdToken();
};

/**
 * 基础请求函数
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // 如果需要认证
  if (options.requireAuth !== false) {
    try {
      const token = await getAuthToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      if (options.requireAuth !== false) {
        throw new Error('请先登录');
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
};

/**
 * AI 分析相关 API
 */
export const aiApi = {
  /**
   * 分析图片
   * @param {Object} params - 分析参数
   * @param {Array} params.electricityBillImages - 电费单图片 (base64)
   * @param {Array} params.efficiencyLabelImages - 能效标签图片
   * @param {Array} params.oldEfficiencyLabelImages - 旧设备能效标签
   * @param {Array} params.financialImages - 财务文件图片
   * @param {string} params.utility - 电力公司 (CLP/HEC)
   * @param {string} params.installationType - 安装类型
   */
  analyze: async (params) => {
    return request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  /**
   * 计算节能效益
   * @param {Object} params - 计算参数
   * @param {Array} params.items - 设备列表
   * @param {string} params.utility - 电力公司
   * @param {number} params.electricityPrice - 电价
   * @param {boolean} params.hasEnergyAudit - 是否有能源审计
   */
  calculate: async (params) => {
    return request('/ai/calculate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
};

/**
 * 用户认证相关 API
 */
export const authApi = {
  /**
   * 获取当前用户信息
   */
  getMe: async () => {
    return request('/auth/me');
  },

  /**
   * 更新用户信息
   */
  updateMe: async (data) => {
    return request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * 删除账户
   */
  deleteAccount: async () => {
    return request('/auth/me', {
      method: 'DELETE'
    });
  }
};

/**
 * 申报记录相关 API
 */
export const applicationApi = {
  /**
   * 获取所有申报记录
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选
   * @param {number} params.limit - 数量限制
   * @param {number} params.offset - 偏移量
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/applications?${query}`);
  },

  /**
   * 获取单个申报记录
   * @param {string} id - 记录 ID
   */
  getById: async (id) => {
    return request(`/applications/${id}`);
  },

  /**
   * 创建申报记录
   * @param {Object} data - 申报数据
   */
  create: async (data) => {
    return request('/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * 更新申报记录
   * @param {string} id - 记录 ID
   * @param {Object} data - 更新数据
   */
  update: async (id, data) => {
    return request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * 删除申报记录
   * @param {string} id - 记录 ID
   */
  delete: async (id) => {
    return request(`/applications/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * 复制申报记录
   * @param {string} id - 记录 ID
   */
  clone: async (id) => {
    return request(`/applications/${id}/clone`, {
      method: 'POST'
    });
  }
};

/**
 * 文件上传相关 API
 */
export const uploadApi = {
  /**
   * 上传文件
   * @param {FormData} formData - 包含文件的 FormData
   */
  upload: async (formData) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }

    return data;
  },

  /**
   * 获取文件
   * @param {string} id - 文件 ID
   */
  getById: async (id) => {
    return request(`/upload/${id}`);
  },

  /**
   * 删除文件
   * @param {string} id - 文件 ID
   */
  delete: async (id) => {
    return request(`/upload/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * 获取文件列表
   * @param {Object} params - 查询参数
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/upload?${query}`);
  }
};

/**
 * 健康检查
 */
export const healthApi = {
  check: async () => {
    return request('/health', { requireAuth: false });
  }
};

export default {
  ai: aiApi,
  auth: authApi,
  application: applicationApi,
  upload: uploadApi,
  health: healthApi
};
