import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tokenStorage, setAuthFailureHandler } from "@/utils/http/axios/http";
import { logout } from "@/api/auth";

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
      void logout();
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    // 公开页面不需要检查
    if (isPublicPath) return;

    // 检查是否有 token
    // 我们只检查是否存在 token，具体的过期检测和刷新交给 useSync 和 axios 拦截器
    // 配合 HomePage 中的 isReady 状态，可以避免在鉴权完成前进行操作
    if (!tokenStorage.getAccessToken()) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, isPublicPath, navigate]);

  return <>{children}</>;
}
