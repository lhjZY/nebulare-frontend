import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { SparklesText } from "@/components/ui/sparkles-text";
import { WarpBackground } from "@/components/ui/warp-background";
import { Sparkles } from "lucide-react";
type AuthMode = "login" | "register";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(
    location.pathname === "/register" ? "register" : "login",
  );

  useEffect(() => {
    setMode(location.pathname === "/register" ? "register" : "login");
  }, [location.pathname]);

  const handleSwitch = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    navigate(nextMode === "login" ? "/login" : "/register", { replace: true });
  };
  const heading = mode === "login" ? "登录你的账号" : "注册新账号";
  const subheading = mode === "login" ? "使用邮箱和密码继续" : "创建并验证你的账户";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold text-foreground">
          <SparklesText className="text-2xl font-bold">星云工作流</SparklesText>
        </h1>
      </div>
      <WarpBackground
        className="w-full max-w-sm md:max-w-5xl xl:max-w-6xl border-none p-8 md:p-20"
        perspective={200}
        beamsPerSide={5}
        beamSize={4}
        beamDuration={4}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mt-4 text-3xl font-semibold text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground">{subheading}</p>
          </div>

          <AuthForm
            mode={mode}
            onSuccess={() => navigate("/", { replace: true })}
            footer={
              mode === "login" ? (
                <>
                  还没有账号？{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => handleSwitch("register")}
                  >
                    去注册
                  </button>
                </>
              ) : (
                <>
                  已有账号？{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => handleSwitch("login")}
                  >
                    去登录
                  </button>
                </>
              )
            }
          />
        </div>
      </WarpBackground>
    </div>
  );
}
