import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tokenStorage, setAuthFailureHandler } from "@/utils/http/axios/http";

type AuthGuardProps = {
  children: React.ReactNode;
};

// 不需要登录的公开页面
const PUBLIC_PATHS = ["/login", "/register"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  useEffect(() => {
    // 设置全局认证失败处理器
    setAuthFailureHandler(() => {
      tokenStorage.clear();
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    // 公开页面不需要检查
    if (isPublicPath) return;

    // 检查是否有 token
    const token = tokenStorage.getAccessToken();
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, isPublicPath, navigate]);

  return <>{children}</>;
}
