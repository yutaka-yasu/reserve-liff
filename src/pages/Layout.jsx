

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Staff } from "@/api/entities";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Menu as MenuIcon,
  Sparkles,
  LogOut,
  UserCog,
  Shield,
  DollarSign,
  TrendingUp // Added TrendingUp icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        try {
          const staffList = await Staff.filter({ user_email: currentUser.email });
          if (staffList.length > 0) {
            setStaffInfo(staffList[0]);
            window.localStorage.setItem('staffInfo', JSON.stringify(staffList[0]));
          } else {
            setStaffInfo(null);
            window.localStorage.removeItem('staffInfo');
          }
        } catch (staffError) {
          console.error("Staff fetch error:", staffError);
          setStaffInfo(null);
          window.localStorage.removeItem('staffInfo');
        }

        setIsLoading(false); // All initial data loading finished
      } catch (error) {
        console.error("Auth error:", error);
        // If auth fails, ensure loading states are reset before redirect
        setIsLoading(false);
        const currentUrl = window.location.href;
        await User.loginWithRedirect(currentUrl);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.localStorage.removeItem('staffInfo');
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/';
    }
  };

  const navigationItems = [
    {
      title: "ダッシュボード",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "顧客管理",
      url: createPageUrl("Customers"),
      icon: Users,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "カルテ記録",
      url: createPageUrl("Treatments"),
      icon: FileText,
      allowedRoles: ["管理者", "一般スタッフ"]
    },
    {
      title: "予約管理",
      url: createPageUrl("Appointments"),
      icon: Calendar,
      allowedRoles: ["管理者", "一般スタッフ"]
    },
    {
      title: "同意書作成",
      url: createPageUrl("CustomerConsent"),
      icon: FileText,
      allowedRoles: ["管理者", "一般スタッフ"]
    },
    {
      title: "統計分析",
      url: createPageUrl("Statistics"),
      icon: TrendingUp,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "スタッフ別施術",
      url: createPageUrl("StaffTreatments"),
      icon: UserCog,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "勤怠管理",
      url: createPageUrl("Attendance"),
      icon: Calendar,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "現金出納表",
      url: createPageUrl("CashBook"),
      icon: DollarSign,
      allowedRoles: ["管理者", "一般スタッフ", "閲覧のみ"]
    },
    {
      title: "スタッフ管理",
      url: createPageUrl("Staff"),
      icon: UserCog,
      allowedRoles: ["管理者"]
    },
    {
      title: "スタッフ査定",
      url: createPageUrl("StaffEvaluation"),
      icon: Sparkles,
      allowedRoles: ["管理者"]
    },
    {
      title: "メニュー管理",
      url: createPageUrl("ServiceMenus"),
      icon: MenuIcon,
      allowedRoles: ["管理者"]
    },
  ];

  const visibleNavigationItems = staffInfo
    ? navigationItems.filter(item => item.allowedRoles.includes(staffInfo.role))
    : navigationItems;

  if (isLoading) { // Modified loading condition
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-300 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  // スタッフ情報が登録されていない場合も、警告を表示するが動作は許可
  const showStaffWarning = !staffInfo;

  // 在籍していないスタッフの場合のみブロック
  if (staffInfo && !staffInfo.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-4">アカウントが無効です</h2>
          <p className="text-stone-600 mb-6">
            このアカウントは現在無効になっています。
            <br /><br />
            詳細は管理者にお問い合わせください。
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </div>
    );
  }

  const roleColors = {
    "管理者": "bg-red-100 text-red-800 border-red-200",
    "一般スタッフ": "bg-blue-100 text-blue-800 border-blue-200",
    "閲覧のみ": "bg-gray-100 text-gray-800 border-gray-200"
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --sidebar-background: #faf9f7;
          --sidebar-foreground: #3d3d3d;
          --sidebar-accent: #e8dfd6;
          --sidebar-accent-foreground: #3d3d3d;
          --primary: #a38b7a;
          --primary-foreground: #ffffff;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
        <Sidebar className="border-r border-stone-200/50 backdrop-blur-sm">
          <SidebarHeader className="border-b border-stone-200/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-300 rounded-2xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-stone-800 text-base leading-tight">ゆたか三田三輪店</h2>
                <p className="text-xs text-stone-500">顧客管理システム</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-stone-500 uppercase tracking-wider px-3 py-2">
                メニュー
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-amber-50/50 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-900 shadow-sm'
                            : 'text-stone-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-stone-200/50 p-4">
            <div className="space-y-3">
              {showStaffWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    スタッフ情報未登録
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-stone-300 to-stone-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {staffInfo?.name?.[0] || user?.email?.[0] || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 text-sm truncate">
                    {staffInfo?.name || user?.email || "ゲスト"}
                  </p>
                  {staffInfo?.role && (
                    <Badge className={`${roleColors[staffInfo.role]} border text-xs mt-1`}>
                      {staffInfo.role}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-stone-300"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-stone-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-lg font-semibold text-stone-800">ゆたか三田三輪店</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

