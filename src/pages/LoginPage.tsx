import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await login({ email, password });
      setMessage("登录成功，已获取 Token");
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setMessage("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center gap-2 text-primary">
            <CheckCircle2 className="h-7 w-7" />
            <span className="text-lg font-semibold">TickClone</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-on-surface">登录你的账号</h1>
          <p className="text-sm text-outline">使用邮箱和密码继续</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">账户登录</CardTitle>
            <p className="text-sm text-outline">输入凭证完成登录</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-on-surface" htmlFor="email">
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
                <label className="text-sm font-medium text-on-surface" htmlFor="password">
                  密码
                </label>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "登录中..." : "登录"}
              </Button>
              {message && <p className="text-sm text-outline text-center">{message}</p>}
            </form>
            <p className="mt-4 text-sm text-outline text-center">
              还没有账号？{" "}
              <Link to="/register" className="text-primary hover:underline">
                去注册
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
