const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const generateKey = () => {
  return crypto.randomBytes(32).toString('base64');
};

const encrypt = (text, keyBase64) => {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
};

const decrypt = (encryptedData, keyBase64, ivHex) => {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  generateKey,
  encrypt,
  decrypt
};