import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function CashTransactionForm({ transaction, onSubmit, onCancel, currentStaffName }) {
  const [formData, setFormData] = useState(transaction || {
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: "入金",
    amount: "",
    category: "",
    payment_method: "現金",
    description: "",
    staff_name: currentStaffName || "",
    customer_name: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const incomeCategoriesCategories = ["施術料金", "商品売上", "その他収入"];
  const expenseCategories = ["仕入れ", "光熱費", "人件費", "消耗品", "その他経費"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-stone-800">
              {transaction ? "取引編集" : "取引を追加"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-stone-600 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">日付 *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleChange("transaction_date", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_type">種別 *</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) => {
                    handleChange("transaction_type", value);
                    handleChange("category", ""); // カテゴリをリセット
                  }}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="入金">入金</SelectItem>
                    <SelectItem value="出金">出金</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">金額 *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                  placeholder="0"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.transaction_type === "入金" ? incomeCategoriesCategories : expenseCategories).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">支払方法 *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleChange("payment_method", value)}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="現金">現金</SelectItem>
                    <SelectItem value="クレジットカード">クレジットカード</SelectItem>
                    <SelectItem value="電子マネー">電子マネー</SelectItem>
                    <SelectItem value="銀行振込">銀行振込</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.transaction_type === "入金" && (
                <div className="space-y-2">
                  <Label htmlFor="customer_name">顧客名</Label>
                  <Input
                    id="customer_name"
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleChange("customer_name", e.target.value)}
                    placeholder="顧客名を入力"
                    className="bg-white border-stone-200"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">摘要</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="取引の詳細を入力..."
                rows={3}
                className="bg-white border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_name">担当者名</Label>
              <Input
                id="staff_name"
                type="text"
                value={formData.staff_name}
                onChange={(e) => handleChange("staff_name", e.target.value)}
                placeholder="担当者名を入力"
                className="bg-white border-stone-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-stone-300"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}