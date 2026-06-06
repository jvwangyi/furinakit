/**
 * Password strength validation
 * At least 8 chars, must contain both letters and numbers
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' };
  }
  if (password.length < 8) {
    return { valid: false, error: '密码至少 8 位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: '密码必须包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '密码必须包含数字' };
  }
  return { valid: true };
}

/**
 * Email format validation
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '邮箱不能为空' };
  }
  // Standard email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '邮箱格式不正确' };
  }
  return { valid: true };
}
