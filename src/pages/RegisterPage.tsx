import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { register, verify } from "@/services/auth";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await verify({ email, code });
      setMessage("验证成功，已获取 Token");
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setMessage("验证码错误或已过期，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">注册</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "register" ? (
            <form className="space-y-4" onSubmit={handleRegister}>
              <Input
                placeholder="邮箱"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="密码"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "发送中..." : "发送验证码并注册"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerify}>
              <Input
                placeholder="验证码"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "验证中..." : "提交验证码"}
              </Button>
            </form>
          )}
          {message && <p className="text-sm text-outline text-center mt-3">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
