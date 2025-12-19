import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, register, verify } from "@/api/auth";
import { Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function AuthForm({ mode, onSuccess, title, subtitle, footer }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    setEmail("");
    setPassword("");
    setCode("");
    setStep("register");
    setMessage(null);
    setShowPassword(false);
  }, [mode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await login({ email, password });
      setMessage("登录成功，已获取 Token");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMessage("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await register({ email, password });
      if (res.status === "pending_verification") {
        setStep("verify");
        setMessage("验证码已发送到邮箱，请输入验证码完成验证");
      } else {
        setMessage("注册成功，请验证邮箱");
      }
    } catch (err) {
      console.error(err);
      setMessage("注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await verify({ email, code });
      setMessage("验证成功，已获取 Token");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMessage("验证码错误或已过期，请重试");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = isLogin
    ? loading
      ? "登录中..."
      : "登录"
    : step === "register"
      ? loading
        ? "发送中..."
        : "发送验证码并注册"
      : loading
        ? "验证中..."
        : "提交验证码";

  const currentTitle = title ?? (isLogin ? "账户登录" : step === "register" ? "注册" : "邮箱验证");

  const currentSubtitle =
    subtitle ??
    (isLogin
      ? "输入凭证完成登录"
      : step === "register"
        ? "发送验证码并创建账户"
        : "输入验证码完成验证");

  const renderFields = () => {
    if (isLogin || step === "register") {
      return (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              邮箱
            </label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              密码
            </label>
            <div className="relative">
              <Input
                id="password"
                placeholder="your password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="code">
          验证码
        </label>
        <Input
          id="code"
          placeholder="输入邮箱收到的验证码"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
    );
  };

  const onSubmit =
    mode === "login"
      ? handleLoginSubmit
      : step === "register"
        ? handleRegisterSubmit
        : handleVerifySubmit;

  return (
    <Card className="shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">{currentTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{currentSubtitle}</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {renderFields()}
          <Button className="w-full" type="submit" disabled={loading}>
            {buttonLabel}
          </Button>
        </form>
        {message && <p className="text-sm text-muted-foreground text-center mt-3">{message}</p>}
        {footer && <div className="mt-4 text-sm text-muted-foreground text-center">{footer}</div>}
      </CardContent>
    </Card>
  );
}
