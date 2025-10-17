
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react"; // Added Loader2 import

export default function CustomerForm({ customer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(customer || {
    name: "",
    name_kana: "",
    phone: "",
    email: "",
    birth_date: "",
    gender: "",
    address: "",
    allergies: "",
    medical_notes: "",
    preferences: "",
    first_visit_date: "",
    tags: []
  });
  const [isChecking, setIsChecking] = useState(false); // Added state for checking

  const handleSubmit = async (e) => { // Made handleSubmit async
    e.preventDefault();
    
    // 新規登録の場合のみ重複チェック
    if (!customer) {
      setIsChecking(true);
      try {
        // 電話番号が空の場合はチェック不要
        if (!formData.phone) {
          onSubmit(formData);
          return;
        }

        // Customerエンティティを動的にインポート
        const { Customer } = await import("@/api/entities");
        const existingCustomers = await Customer.list();
        
        // フォームに入力された電話番号と一致する顧客を検索
        // 既存顧客編集の場合は、自分自身を除外する条件 c.id !== customer?.id を含めるが、
        // !customer の場合は customer?.id は undefined なので、実質 formData.phone との一致のみ
        const duplicateCustomer = existingCustomers.find(c => 
          c.phone === formData.phone && c.id !== customer?.id
        );
        
        if (duplicateCustomer) {
          // Temporarily set isChecking to false to allow confirm dialog to be interactive
          setIsChecking(false); 
          const confirmResult = confirm(
            `この電話番号（${formData.phone}）は既に「${duplicateCustomer.name}」様で登録されています。\n\n` +
            `それでも新しい顧客として登録しますか？\n\n` +
            `※同じ方の場合は「キャンセル」を押して、既存の顧客情報を編集してください。`
          );
          
          if (!confirmResult) {
            return; // ユーザーがキャンセルした場合、フォーム送信を中断
          }
        }
      } catch (err) {
        console.error("重複チェックエラー:", err);
        // エラーが発生した場合もユーザーに続行を許可するか、エラーメッセージを表示するかは要件による
        // ここではエラーでも続行を許可する
      } finally {
        setIsChecking(false); // チェックが完了したら状態をリセット
      }
    }
    
    // 重複チェックをパスしたか、既存顧客編集の場合はそのまま送信
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-stone-800">
          {customer ? "顧客情報編集" : "新規顧客登録"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">お名前 *</Label>
              <Input
                id="name"
                name="name"
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
                name="name_kana"
                value={formData.name_kana}
                onChange={(e) => handleChange("name_kana", e.target.value)}
                className="bg-white border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号 *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                className="bg-white border-stone-200"
              />
              {!customer && ( // Show hint only for new customer creation
                <p className="text-xs text-amber-600">
                  ※ 重複登録を防ぐため、電話番号をチェックします
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-white border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">生年月日</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
                className="bg-white border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger id="gender" className="bg-white border-stone-200">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_visit_date">初回来店日</Label>
              <Input
                id="first_visit_date"
                name="first_visit_date"
                type="date"
                value={formData.first_visit_date}
                onChange={(e) => handleChange("first_visit_date", e.target.value)}
                className="bg-white border-stone-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="bg-white border-stone-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">アレルギー情報</Label>
            <Textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              className="bg-white border-stone-200 h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_notes">医療的注意事項</Label>
            <Textarea
              id="medical_notes"
              name="medical_notes"
              value={formData.medical_notes}
              onChange={(e) => handleChange("medical_notes", e.target.value)}
              className="bg-white border-stone-200 h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">好みや要望</Label>
            <Textarea
              id="preferences"
              name="preferences"
              value={formData.preferences}
              onChange={(e) => handleChange("preferences", e.target.value)}
              className="bg-white border-stone-200 h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-stone-300 hover:bg-stone-50"
              disabled={isChecking} // Disable cancel button during check
            >
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500"
              disabled={isChecking} // Disable submit button during check
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  確認中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {customer ? "更新" : "登録"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
