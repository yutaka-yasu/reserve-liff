import React, { useState, useEffect } from "react";
import { ServiceMenu, Staff, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import ServiceMenuForm from "../components/menus/ServiceMenuForm";
import ServiceMenuList from "../components/menus/ServiceMenuList";

export default function ServiceMenus() {
  const [menus, setMenus] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);

  useEffect(() => {
    loadCurrentStaff();
  }, []);

  useEffect(() => {
    if (currentStaffInfo && currentStaffInfo.role === "管理者") {
      loadMenus();
    }
  }, [currentStaffInfo]);

  const loadCurrentStaff = async () => {
    try {
      const user = await User.me();
      const staffList = await Staff.filter({ user_email: user.email });
      if (staffList.length > 0) {
        setCurrentStaffInfo(staffList[0]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading current staff:", err);
      setIsLoading(false);
    }
  };

  const loadMenus = async () => {
    setIsLoading(true);
    const data = await ServiceMenu.list("-created_date");
    setMenus(data);
    setIsLoading(false);
  };

  const handleSubmit = async (menuData) => {
    if (editingMenu) {
      await ServiceMenu.update(editingMenu.id, menuData);
    } else {
      await ServiceMenu.create(menuData);
    }
    setShowForm(false);
    setEditingMenu(null);
    loadMenus();
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleDelete = async (menuId) => {
    if (confirm("このメニューを削除してもよろしいですか？")) {
      await ServiceMenu.delete(menuId);
      loadMenus();
    }
  };

  const handleToggleActive = async (menu) => {
    await ServiceMenu.update(menu.id, { ...menu, is_active: !menu.is_active });
    loadMenus();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 管理者のみアクセス可能
  if (!currentStaffInfo || currentStaffInfo.role !== "管理者") {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">アクセス権限がありません</h2>
          <p className="text-stone-600">この機能は管理者のみ利用できます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">メニュー管理</h1>
            <p className="text-stone-600 mt-1">サービスメニューの登録・管理</p>
          </div>
          <Button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingMenu(null);
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            新規メニュー登録
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <ServiceMenuForm
              menu={editingMenu}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMenu(null);
              }}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <ServiceMenuList
            menus={menus}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        )}
      </div>
    </div>
  );
}