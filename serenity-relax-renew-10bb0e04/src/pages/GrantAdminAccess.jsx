import React, { useState, useEffect } from "react";
import { Staff } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, UserCog } from "lucide-react";

export default function GrantAdminAccess() {
  const [currentUser, setCurrentUser] = useState(null);
  const [staffRecord, setStaffRecord] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const staffList = await Staff.list();
      setAllStaff(staffList);
      
      const myStaff = staffList.find(s => s.user_email === user.email);
      setStaffRecord(myStaff);
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setIsLoading(false);
    }
  };

  const grantAdminToMe = async () => {
    if (!staffRecord) {
      setMessage({ type: "error", text: "スタッフ情報が見つかりません。先にスタッフ登録が必要です。" });
      return;
    }

    try {
      await Staff.update(staffRecord.id, {
        ...staffRecord,
        role: "管理者"
      });
      setMessage({ type: "success", text: "管理者権限を付与しました！ページを再読み込みしてください。" });
      await loadData();
    } catch (err) {
      console.error("Error granting admin:", err);
      setMessage({ type: "error", text: "エラーが発生しました" });
    }
  };

  const grantAdminToStaff = async (staff) => {
    try {
      await Staff.update(staff.id, {
        ...staff,
        role: "管理者"
      });
      setMessage({ type: "success", text: `${staff.name}さんに管理者権限を付与しました！` });
      await loadData();
    } catch (err) {
      console.error("Error granting admin:", err);
      setMessage({ type: "error", text: "エラーが発生しました" });
    }
  };

  const revokeAdmin = async (staff) => {
    try {
      await Staff.update(staff.id, {
        ...staff,
        role: "一般スタッフ"
      });
      setMessage({ type: "success", text: `${staff.name}さんの管理者権限を解除しました` });
      await loadData();
    } catch (err) {
      console.error("Error revoking admin:", err);
      setMessage({ type: "error", text: "エラーが発生しました" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
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
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            アクセス権限管理
          </h1>
          <p className="text-stone-600 mt-2">スタッフの権限を管理します</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === "success" 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          } flex items-start gap-3`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === "success" ? "text-green-800" : "text-red-800"}>
              {message.text}
            </p>
          </div>
        )}

        {/* 自分の権限 */}
        <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="text-xl font-bold text-stone-800">
              あなたの権限
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staffRecord ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {staffRecord.name?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{staffRecord.name}</h3>
                    <p className="text-sm text-stone-600">{currentUser?.email}</p>
                  </div>
                  <Badge className={`${roleColors[staffRecord.role]} border ml-auto`}>
                    {staffRecord.role}
                  </Badge>
                </div>
                
                {staffRecord.role !== "管理者" && (
                  <Button
                    onClick={grantAdminToMe}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    自分に管理者権限を付与
                  </Button>
                )}
                
                {staffRecord.role === "管理者" && (
                  <div className="p-4 rounded-lg bg-green-100 border border-green-200 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-semibold">管理者権限があります</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-stone-700 font-semibold mb-2">スタッフ情報が未登録です</p>
                <p className="text-sm text-stone-600">
                  スタッフ管理ページで自分のスタッフ情報を登録してください
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 全スタッフ一覧 */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-600" />
              全スタッフ ({allStaff.length}人)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {allStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-stone-300 to-stone-400 rounded-full flex items-center justify-center text-white font-bold">
                        {staff.name?.[0] || "?"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-800">{staff.name}</h4>
                        <p className="text-xs text-stone-500">{staff.user_email}</p>
                      </div>
                      <Badge className={`${roleColors[staff.role]} border text-xs`}>
                        {staff.role}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {staff.role !== "管理者" && (
                        <Button
                          size="sm"
                          onClick={() => grantAdminToStaff(staff)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          管理者に
                        </Button>
                      )}
                      {staff.role === "管理者" && staffRecord?.role === "管理者" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => revokeAdmin(staff)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          権限解除
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📝 権限について</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>管理者:</strong> 全機能にアクセス可能（スタッフ管理、メニュー管理など）</li>
            <li><strong>一般スタッフ:</strong> カルテ記録、予約管理が可能</li>
            <li><strong>閲覧のみ:</strong> データの閲覧のみ可能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}