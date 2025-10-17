
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { X, Save, Shield } from "lucide-react";

export default function StaffForm({ staff, onSubmit, onCancel, currentStaffRole }) {
  const [formData, setFormData] = useState(staff || {
    name: "",
    name_kana: "",
    user_email: "",
    phone: "",
    email: "",
    position: "",
    employment_type: "正社員", // Added employment_type with default
    role: "一般スタッフ",
    specialties: [],
    hire_date: "",
    is_active: true,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canEditRole = currentStaffRole === "管理者";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-xl font-bold text-stone-800">
            {staff ? "スタッフ情報編集" : "新規スタッフ登録"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">お名前 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_kana">ふりがな</Label>
                <Input
                  id="name_kana"
                  value={formData.name_kana}
                  onChange={(e) => handleChange("name_kana", e.target.value)}
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="user_email" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  ログイン用メールアドレス *
                </Label>
                <Input
                  id="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => handleChange("user_email", e.target.value)}
                  required
                  placeholder="このメールアドレスでログインします"
                  className="bg-white border-stone-200"
                />
                <p className="text-xs text-stone-500">
                  ※ このメールアドレスのGoogleアカウントでログインできます
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">連絡先メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">役職</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => handleChange("position", value)}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="セラピスト">セラピスト</SelectItem>
                    <SelectItem value="チーフセラピスト">チーフセラピスト</SelectItem>
                    <SelectItem value="マネージャー">マネージャー</SelectItem>
                    <SelectItem value="受付">受付</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">雇用形態</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => handleChange("employment_type", value)}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正社員">正社員</SelectItem>
                    <SelectItem value="パート">パート</SelectItem>
                    <SelectItem value="助っ人">助っ人</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  権限 {!canEditRole && <span className="text-xs text-stone-500">（管理者のみ変更可）</span>}
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                  disabled={!canEditRole}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="管理者">管理者（全機能）</SelectItem>
                    <SelectItem value="一般スタッフ">一般スタッフ（施術記録）</SelectItem>
                    <SelectItem value="閲覧のみ">閲覧のみ</SelectItem>
                  </SelectContent>
                </Select>
                {!canEditRole && (
                  <p className="text-xs text-amber-600">
                    ※ 権限の変更は管理者のみ可能です
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">入社日</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                  className="bg-white border-stone-200"
                />
              </div>
            </div>

            {/* 報酬計算の説明 */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">💰 報酬計算方式</h3>
              <div className="space-y-3 text-sm text-green-800">
                <div>
                  <p className="font-semibold">一般スタッフ：時間単価制</p>
                  <p className="text-xs">施術時間 × 1分25円</p>
                  <p className="text-xs">例：240分（4時間）→ 240分 × ¥25 = <strong>¥6,000</strong></p>
                </div>
                <hr className="border-green-300" />
                <div>
                  <p className="font-semibold">マネージャー：歩合制</p>
                  <p className="text-xs">店舗総売上の25%</p>
                  <p className="text-xs">例：総売上100万円 → <strong>¥250,000</strong></p>
                  <p className="text-xs text-green-600">※複数マネージャーがいる場合は、マネージャー間で時間比率により分配</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="bg-white border-stone-200 h-24"
                placeholder="資格、経験年数など"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
                id="is_active"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                在籍中
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-stone-300 hover:bg-stone-50"
              >
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {staff ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
