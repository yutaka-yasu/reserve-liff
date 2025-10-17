import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function ServiceMenuForm({ menu, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(menu || {
    menu_name: "",
    category: "",
    duration: "",
    price: "",
    description: "",
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-xl font-bold text-stone-800">
            {menu ? "メニュー編集" : "新規メニュー登録"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="menu_name">メニュー名 *</Label>
                <Input
                  id="menu_name"
                  value={formData.menu_name}
                  onChange={(e) => handleChange("menu_name", e.target.value)}
                  required
                  placeholder="例: アロマオイルマッサージ"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリー</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="マッサージ">マッサージ</SelectItem>
                    <SelectItem value="アロマ">アロマ</SelectItem>
                    <SelectItem value="フェイシャル">フェイシャル</SelectItem>
                    <SelectItem value="ボディケア">ボディケア</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">所要時間（分） *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", parseFloat(e.target.value))}
                  required
                  placeholder="60"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">料金 *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", parseFloat(e.target.value))}
                  required
                  placeholder="5000"
                  className="bg-white border-stone-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="メニューの詳細説明"
                className="bg-white border-stone-200 h-24"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
                id="is_active"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                メニューを有効にする
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
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {menu ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}