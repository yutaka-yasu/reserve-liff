import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

export default function AttendanceForm({ attendance, staff, onSubmit, onCancel }) {
  // 既存の時刻データを時と分に分割
  const parseTime = (timeString) => {
    if (!timeString) return { hour: "", minute: "" };
    const [hour, minute] = timeString.split(':');
    return { hour, minute };
  };

  const initialStartTime = parseTime(attendance?.start_time || "");
  const initialEndTime = parseTime(attendance?.end_time || "");

  const [formData, setFormData] = useState(attendance || {
    staff_id: "",
    staff_name: "",
    attendance_date: new Date().toISOString().split('T')[0],
    work_type: "出勤",
    start_time: "",
    end_time: "",
    notes: ""
  });

  const [startHour, setStartHour] = useState(initialStartTime.hour);
  const [startMinute, setStartMinute] = useState(initialStartTime.minute);
  const [endHour, setEndHour] = useState(initialEndTime.hour);
  const [endMinute, setEndMinute] = useState(initialEndTime.minute);

  // 時間のオプション（7時から23時）
  const hourOptions = Array.from({ length: 17 }, (_, i) => String(i + 7).padStart(2, '0'));

  // 分のオプション（0分から59分）
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // 時と分を結合して時刻文字列を作成
  const combineTime = (hour, minute) => {
    if (!hour || !minute) return "";
    return `${hour}:${minute}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // スタッフ名を設定
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    
    const dataToSubmit = {
      ...formData,
      staff_name: selectedStaff?.name || formData.staff_name,
      start_time: combineTime(startHour, startMinute),
      end_time: combineTime(endHour, endMinute)
    };
    
    onSubmit(dataToSubmit);
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
            {attendance && attendance.id ? "出勤記録編集" : "出勤記録登録"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="staff_id">スタッフ *</Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) => handleChange("staff_id", value)}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance_date">日付 *</Label>
                <Input
                  id="attendance_date"
                  type="date"
                  value={formData.attendance_date}
                  onChange={(e) => handleChange("attendance_date", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_type">勤務種別 *</Label>
                <Select
                  value={formData.work_type}
                  onValueChange={(value) => handleChange("work_type", value)}
                  required
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="出勤">出勤</SelectItem>
                    <SelectItem value="休み">休み</SelectItem>
                    <SelectItem value="スポット">スポット</SelectItem>
                    <SelectItem value="遅刻">遅刻</SelectItem>
                    <SelectItem value="早退">早退</SelectItem>
                    <SelectItem value="欠勤">欠勤</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>出勤時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={startHour}
                    onValueChange={setStartHour}
                  >
                    <SelectTrigger className="bg-white border-stone-200 flex-1">
                      <SelectValue placeholder="時" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {hourOptions.map(hour => (
                        <SelectItem key={hour} value={hour}>
                          {hour}時
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center text-stone-600">:</span>
                  <Select
                    value={startMinute}
                    onValueChange={setStartMinute}
                  >
                    <SelectTrigger className="bg-white border-stone-200 flex-1">
                      <SelectValue placeholder="分" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {minuteOptions.map(minute => (
                        <SelectItem key={minute} value={minute}>
                          {minute}分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-stone-500">7時〜23時、0分〜59分</p>
              </div>

              <div className="space-y-2">
                <Label>退勤時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={endHour}
                    onValueChange={setEndHour}
                  >
                    <SelectTrigger className="bg-white border-stone-200 flex-1">
                      <SelectValue placeholder="時" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {hourOptions.map(hour => (
                        <SelectItem key={hour} value={hour}>
                          {hour}時
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center text-stone-600">:</span>
                  <Select
                    value={endMinute}
                    onValueChange={setEndMinute}
                  >
                    <SelectTrigger className="bg-white border-stone-200 flex-1">
                      <SelectValue placeholder="分" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {minuteOptions.map(minute => (
                        <SelectItem key={minute} value={minute}>
                          {minute}分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-stone-500">7時〜23時、0分〜59分</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="bg-white border-stone-200 h-24"
                placeholder="特記事項があれば入力してください"
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
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {attendance && attendance.id ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}