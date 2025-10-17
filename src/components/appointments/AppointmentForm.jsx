import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function AppointmentForm({ appointment, customers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(appointment || {
    customer_id: "",
    customer_name: "",
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: "",
    service_menu: "",
    duration: "",
    status: "confirmed",
    notes: "",
    phone: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name,
        phone: customer.phone
      }));
    }
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
            {appointment ? "予約編集" : "新規予約登録"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_id">顧客 *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerChange}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">連絡先</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="電話番号"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_date">予約日 *</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleChange("appointment_date", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time">予約時間 *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleChange("appointment_time", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_menu">施術メニュー *</Label>
                <Input
                  id="service_menu"
                  value={formData.service_menu}
                  onChange={(e) => handleChange("service_menu", e.target.value)}
                  required
                  placeholder="例: アロマオイルマッサージ"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">予定時間（分）</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", parseFloat(e.target.value))}
                  placeholder="60"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">確認済み</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                    <SelectItem value="no_show">来店なし</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="特記事項があれば記入"
                className="bg-white border-stone-200 h-24"
              />
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
                className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {appointment ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}