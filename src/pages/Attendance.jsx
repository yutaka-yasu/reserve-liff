
import React, { useState, useEffect } from "react";
import { Attendance, Staff, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, Clock, Shield, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay } from "date-fns";
import { ja } from "date-fns/locale";

import AttendanceForm from "../components/attendance/AttendanceForm";

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);

  useEffect(() => {
    loadCurrentStaff();
  }, []);

  useEffect(() => {
    if (currentStaffInfo) {
      loadData();
    }
  }, [currentStaffInfo, selectedMonth]);

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

  const loadData = async () => {
    setIsLoading(true);
    const [attendanceData, staffData] = await Promise.all([
      Attendance.list("-attendance_date"),
      Staff.list()
    ]);
    setAttendances(attendanceData);
    setStaff(staffData.filter(s => s.is_active));
    setIsLoading(false);
  };

  const handleSubmit = async (attendanceData) => {
    if (editingAttendance && editingAttendance.id) {
      // IDが存在する場合のみ更新
      await Attendance.update(editingAttendance.id, attendanceData);
    } else {
      // IDがない場合は新規作成
      await Attendance.create(attendanceData);
    }
    setShowForm(false);
    setEditingAttendance(null);
    loadData();
  };

  const handleEdit = (attendance) => {
    setEditingAttendance(attendance);
    setShowForm(true);
  };

  const handleDateClick = (date, staffMember) => {
    const attendance = getAttendanceForDate(date, staffMember.id);
    if (attendance) {
      // 既存の記録を編集
      setEditingAttendance(attendance);
    } else {
      // 新規記録を作成（日付とスタッフを事前設定）
      setEditingAttendance({
        staff_id: staffMember.id,
        staff_name: staffMember.name,
        attendance_date: format(date, 'yyyy-MM-dd'),
        work_type: "出勤"
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (attendanceId) => {
    if (confirm("この出勤記録を削除してもよろしいですか？")) {
      await Attendance.delete(attendanceId);
      loadData();
    }
  };

  // 月のカレンダーデータを生成（曜日を考慮）
  const getMonthCalendar = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    
    // 月の最初の日の曜日を取得（0=日曜日, 1=月曜日, ...）
    const firstDayOfWeek = getDay(start); // Changed from start.getDay() to getDay(start) for date-fns consistency
    
    // 最初の週の空白セルを追加
    const blanks = Array(firstDayOfWeek).fill(null);
    
    return [...blanks, ...days];
  };

  // 特定の日のスタッフ出勤データを取得
  const getAttendanceForDate = (date, staffId) => {
    return attendances.find(a => 
      a.staff_id === staffId && 
      isSameDay(parseISO(a.attendance_date), date)
    );
  };

  // スタッフの月次統計を計算
  const calculateMonthlyStats = (staffId) => {
    const monthAttendances = attendances.filter(a => {
      const attDate = new Date(a.attendance_date);
      const attMonth = `${attDate.getFullYear()}-${String(attDate.getMonth() + 1).padStart(2, '0')}`;
      return attMonth === selectedMonth && a.staff_id === staffId;
    });

    const workDays = monthAttendances.filter(a => a.work_type === "出勤").length;
    const spotDays = monthAttendances.filter(a => a.work_type === "スポット").length;
    const lateDays = monthAttendances.filter(a => a.work_type === "遅刻").length;
    const earlyLeaveDays = monthAttendances.filter(a => a.work_type === "早退").length;
    const absentDays = monthAttendances.filter(a => a.work_type === "欠勤").length;
    const offDays = monthAttendances.filter(a => a.work_type === "休み").length;

    return {
      workDays,
      spotDays,
      lateDays,
      earlyLeaveDays,
      absentDays,
      offDays,
      totalRecords: monthAttendances.length
    };
  };

  const workTypeColors = {
    "出勤": "bg-green-100 text-green-800 border-green-200",
    "休み": "bg-gray-100 text-gray-800 border-gray-200",
    "遅刻": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "早退": "bg-orange-100 text-orange-800 border-orange-200",
    "欠勤": "bg-red-100 text-red-800 border-red-200",
    "スポット": "bg-indigo-100 text-indigo-800 border-indigo-200"
  };

  const workTypeIcons = {
    "出勤": <CheckCircle className="w-4 h-4" />,
    "休み": <XCircle className="w-4 h-4" />,
    "遅刻": <Clock className="w-4 h-4" />,
    "早退": <Clock className="w-4 h-4" />,
    "欠勤": <XCircle className="w-4 h-4" />,
    "スポット": <Star className="w-4 h-4" />
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full flex items-center justify-center animate-pulse">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentStaffInfo) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">アクセス権限がありません</h2>
          <p className="text-stone-600">この機能はスタッフのみ利用できます。</p>
        </div>
      </div>
    );
  }

  const canEdit = currentStaffInfo.role === "管理者";
  const filteredStaff = selectedStaff === "all" ? staff : staff.filter(s => s.id === selectedStaff);
  const monthDays = getMonthCalendar();
  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">勤怠管理</h1>
            <p className="text-stone-600 mt-1">スタッフの出勤状況を記録・管理</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40 bg-white/80 border-stone-200">
                <SelectValue placeholder="月を選択" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const monthStr = date.toISOString().slice(0, 7);
                  const [year, month] = monthStr.split('-');
                  return (
                    <SelectItem key={monthStr} value={monthStr}>
                      {year}年{month}月
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-48 bg-white/80 border-stone-200">
                <SelectValue placeholder="スタッフを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全スタッフ</SelectItem>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canEdit && (
              <Button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingAttendance(null);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                出勤記録
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <AttendanceForm
            attendance={editingAttendance}
            staff={staff}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAttendance(null);
            }}
          />
        )}

        {!showForm && (
          <div className="space-y-6">
            {/* 月次統計サマリー */}
            {selectedStaff !== "all" && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader className="border-b border-emerald-100">
                  <CardTitle className="text-xl font-bold text-stone-800">
                    {staff.find(s => s.id === selectedStaff)?.name}の{monthDisplay}実績
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const stats = calculateMonthlyStats(selectedStaff);
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="p-4 rounded-lg bg-green-100 border border-green-200">
                          <p className="text-sm text-green-800 mb-1">出勤日数</p>
                          <p className="text-2xl font-bold text-green-900">{stats.workDays}日</p>
                        </div>
                        <div className="p-4 rounded-lg bg-indigo-100 border border-indigo-200">
                          <p className="text-sm text-indigo-800 mb-1">スポット</p>
                          <p className="text-2xl font-bold text-indigo-900">{stats.spotDays}回</p>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-100 border border-yellow-200">
                          <p className="text-sm text-yellow-800 mb-1">遅刻</p>
                          <p className="text-2xl font-bold text-yellow-900">{stats.lateDays}回</p>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-100 border border-orange-200">
                          <p className="text-sm text-orange-800 mb-1">早退</p>
                          <p className="text-2xl font-bold text-orange-900">{stats.earlyLeaveDays}回</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-100 border border-red-200">
                          <p className="text-sm text-red-800 mb-1">欠勤</p>
                          <p className="text-2xl font-bold text-red-900">{stats.absentDays}回</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-100 border border-gray-200">
                          <p className="text-sm text-gray-800 mb-1">休み</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.offDays}日</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* カレンダー表示 */}
            {filteredStaff.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-xl bg-white/90">
                  <CardHeader className="border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-300 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {member.name?.[0] || "?"}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-stone-800">{member.name}</CardTitle>
                        {member.position && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.position}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                        <div key={i} className="text-center font-bold text-stone-600 text-sm py-2">
                          {day}
                        </div>
                      ))}
                      
                      {monthDays.map((day, i) => {
                        if (!day) {
                          // 空白セル
                          return <div key={`blank-${i}`} className="p-2" />;
                        }

                        const attendance = getAttendanceForDate(day, member.id);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <div
                            key={i}
                            className={`
                              relative p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              ${isToday ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200'}
                              ${attendance ? 'hover:shadow-md' : 'bg-stone-50 hover:bg-stone-100'}
                              ${canEdit ? '' : 'cursor-not-allowed opacity-50'}
                            `}
                            onClick={() => canEdit && handleDateClick(day, member)}
                          >
                            <div className="text-center">
                              <p className={`text-sm font-semibold ${isToday ? 'text-emerald-900' : 'text-stone-700'}`}>
                                {format(day, 'd')}
                              </p>
                              {attendance && (
                                <div className="mt-1">
                                  <Badge className={`${workTypeColors[attendance.work_type]} border text-xs flex items-center justify-center gap-1`}>
                                    {workTypeIcons[attendance.work_type]}
                                    {attendance.work_type}
                                  </Badge>
                                  {attendance.start_time && (
                                    <p className="text-xs text-stone-500 mt-1">
                                      {attendance.start_time}
                                      {attendance.end_time && `~${attendance.end_time}`}
                                    </p>
                                  )}
                                </div>
                              )}
                              {!attendance && canEdit && (
                                <p className="text-xs text-stone-400 mt-1">+</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
