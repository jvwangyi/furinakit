'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Shield, UserPlus, LogIn, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { withBasePath } from '@/lib/basePath';

type Tab = 'login' | 'register' | 'forgot' | 'verify-email';
type ForgotStep = 'email' | 'code';

export default function SignInPage() {
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Email verification state
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const verifyCodeRef = useRef<HTMLInputElement>(null);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [githubEnabled, setGithubEnabled] = useState(false);

  // Check if GitHub OAuth is configured
  useEffect(() => {
    fetch(withBasePath('/api/auth/providers'))
      .then(res => res.json())
      .then(providers => {
        if (providers?.github) setGithubEnabled(true);
      })
      .catch(() => {});
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown for email verification resend
  useEffect(() => {
    if (verifyCountdown > 0) {
      const timer = setTimeout(() => setVerifyCountdown(verifyCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyCountdown]);

  // Focus verify code input
  useEffect(() => {
    if (tab === 'verify-email') {
      verifyCodeRef.current?.focus();
    }
  }, [tab]);

  // Focus code input when switching to code step
  useEffect(() => {
    if (forgotStep === 'code') {
      codeInputRef.current?.focus();
    }
  }, [forgotStep]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const switchTab = (newTab: Tab) => {
    clearMessages();
    setTab(newTab);
    if (newTab === 'forgot') {
      setForgotStep('email');
      setForgotCode('');
      setForgotNewPassword('');
    }
  };

  // ===== Login =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(withBasePath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (data.success) {
        // Cookie is set by the server as httpOnly
        window.location.href = window.location.origin + '/furinakit/';
      } else if (data.needVerification) {
        // Email not verified, switch to verification step
        setRegEmail(data.email || loginEmail);
        setTab('verify-email');
        setVerifyCountdown(60);
        setVerifyCode('');
        setError('');
      } else {
        setError(data.error || '登录失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== Register =====
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(withBasePath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.needVerification) {
          // Need email verification
          setTab('verify-email');
          setVerifyCountdown(60);
          setVerifyCode('');
        } else {
          // Fallback: auto-login
          setSuccess('注册成功，请登录');
          setTab('login');
          setLoginEmail(regEmail);
        }
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== Verify Email =====
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.length !== 6) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(withBasePath('/api/auth/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, code: verifyCode }),
      });

      const data = await res.json();

      if (data.success) {
        // Cookie is set by the server as httpOnly
        window.location.href = window.location.origin + '/furinakit/';
      } else {
        setError(data.error || '验证失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== Resend Verify Code =====
  const handleResendVerifyCode = async () => {
    if (verifyCountdown > 0) return;
    setLoading(true);
    clearMessages();
    try {
      const res = await fetch(withBasePath('/api/auth/magic-link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyCountdown(60);
        setSuccess('验证码已重新发送');
      } else {
        setError(data.error || '发送失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== Forgot Password - Send Code =====
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(withBasePath('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setForgotStep('code');
        setCountdown(60);
      } else {
        setError(data.error || '发送失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== Forgot Password - Reset =====
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode || forgotCode.length !== 6 || !forgotNewPassword) return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(withBasePath('/api/auth/reset-password/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotCode,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('密码重置成功，请登录');
        setTab('login');
        setLoginEmail(forgotEmail);
        setLoginPassword('');
      } else {
        setError(data.error || '重置失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendResetCode(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {tab === 'login' && <><LogIn className="h-5 w-5" /> 登录 FurinaKit</>}
            {tab === 'register' && <><UserPlus className="h-5 w-5" /> 注册 FurinaKit</>}
            {tab === 'forgot' && <><KeyRound className="h-5 w-5" /> 重置密码</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab switcher - only show on login/register */}
          {tab !== 'forgot' && (
            <div className="flex border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === 'login'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === 'register'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {/* Error / Success messages */}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center">{success}</p>}

          {/* ===== Login Tab ===== */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="email"
                placeholder="邮箱"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
              <Input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => switchTab('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  忘记密码？
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-sm text-primary hover:underline"
                >
                  没有账号？注册
                </button>
              </div>
            </form>
          )}

          {/* ===== Register Tab ===== */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                type="text"
                placeholder="昵称（选填）"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                autoFocus
              />
              <Input
                type="email"
                placeholder="邮箱"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="密码（至少 8 位，含字母和数字）"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-sm text-primary hover:underline"
                >
                  已有账号？登录
                </button>
              </div>
            </form>
          )}

          {/* ===== Forgot Password Tab ===== */}
          {tab === 'forgot' && forgotStep === 'email' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                输入注册邮箱，我们将发送验证码
              </p>
              <form onSubmit={handleSendResetCode} className="space-y-3">
                <Input
                  type="email"
                  placeholder="邮箱"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '发送中...' : '发送验证码'}
                </Button>
              </form>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  返回登录
                </button>
              </div>
            </>
          )}

          {tab === 'forgot' && forgotStep === 'code' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                验证码已发送至 <strong>{forgotEmail}</strong>
              </p>
              <form onSubmit={handleResetPassword} className="space-y-3">
                <Input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="6 位验证码"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  required
                />
                <Input
                  type="password"
                  placeholder="新密码（至少 8 位，含字母和数字）"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button type="submit" className="w-full" disabled={loading || forgotCode.length !== 6}>
                  {loading ? '重置中...' : '重置密码'}
                </Button>
              </form>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setForgotStep('email'); setForgotCode(''); setForgotNewPassword(''); setError(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← 更换邮箱
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                </button>
              </div>
            </>
          )}

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              返回首页
            </Link>
          </div>

          {/* ===== Email Verification Tab ===== */}
          {tab === 'verify-email' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                验证码已发送至 <strong>{regEmail}</strong>
              </p>
              <form onSubmit={handleVerifyEmail} className="space-y-3">
                <Input
                  ref={verifyCodeRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="6 位验证码"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  required
                />
                <Button type="submit" className="w-full" disabled={loading || verifyCode.length !== 6}>
                  {loading ? '验证中...' : '验证并完成注册'}
                </Button>
              </form>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setTab('register'); setVerifyCode(''); setError(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← 返回注册
                </button>
                <button
                  type="button"
                  onClick={handleResendVerifyCode}
                  disabled={verifyCountdown > 0}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {verifyCountdown > 0 ? `${verifyCountdown}s 后重发` : '重新发送'}
                </button>
              </div>
            </>
          )}

          {/* GitHub OAuth - only show if configured */}
          {githubEnabled && (tab === 'login' || tab === 'register') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn('github', { callbackUrl: window.location.origin + '/furinakit/' })}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                使用 GitHub 登录
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            不登录也能使用所有工具，登录后可同步收藏和历史记录
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
