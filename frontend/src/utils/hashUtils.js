/**
 * 生成文件的 SHA-256 哈希值作为唯一指纹
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const getFileHash = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * 生成一组文件的组合哈希值
 * @param {File[]} files 
 * @returns {Promise<string>}
 */
export const getFilesCombinedHash = async (files) => {
  if (!files || files.length === 0) return "";
  
  // 对文件进行排序以确保顺序一致
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
  
  const hashes = await Promise.all(sortedFiles.map(file => getFileHash(file)));
  const combinedString = hashes.join('|');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(combinedString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
