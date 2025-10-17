import React, { useState, useEffect } from "react";
import { Treatment, Appointment, Attendance, DailyRejection, Staff, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, Users, Clock, XCircle, TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function StatisticsPage() {
  const [treatments, setTreatments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [rejections, setRejections] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
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
    const [treatmentData, appointmentData, attendanceData, rejectionData] = await Promise.all([
      Treatment.list(),
      Appointment.list(),
      Attendance.list(),
      DailyRejection.list()
    ]);
    setTreatments(treatmentData);
    setAppointments(appointmentData);
    setAttendances(attendanceData);
    setRejections(rejectionData);
    setIsLoading(false);
  };

  // 選択された月のデータをフィルター
  const filterByMonth = (data, dateField) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const itemMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      return itemMonth === selectedMonth;
    });
  };

  const monthTreatments = filterByMonth(treatments, 'treatment_date');
  const monthAppointments = filterByMonth(appointments, 'appointment_date');
  const monthAttendances = filterByMonth(attendances, 'attendance_date').filter(a => a.work_type === "出勤");
  const monthRejections = filterByMonth(rejections, 'rejection_date');

  // 曜日別客数（施術実績）
  const customersByWeekday = WEEKDAYS.map((day, index) => {
    const count = monthTreatments.filter(t => {
      const date = new Date(t.treatment_date);
      return getDay(date) === index;
    }).length;
    return { weekday: day, count };
  });

  // 曜日別スタッフ出勤数
  const staffByWeekday = WEEKDAYS.map((day, index) => {
    const dates = eachDayOfInterval({
      start: startOfMonth(new Date(selectedMonth + '-01')),
      end: endOfMonth(new Date(selectedMonth + '-01'))
    }).filter(date => getDay(date) === index);

    let totalStaff = 0;
    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAttendances = monthAttendances.filter(a => a.attendance_date === dateStr);
      totalStaff += dayAttendances.length;
    });

    const avgStaff = dates.length > 0 ? (totalStaff / dates.length).toFixed(1) : 0;

    return { weekday: day, avgStaff: parseFloat(avgStaff), totalStaff };
  });

  // 曜日別お断り数
  const rejectionsByWeekday = WEEKDAYS.map((day, index) => {
    const count = monthRejections.reduce((sum, r) => {
      const date = new Date(r.rejection_date);
      return getDay(date) === index ? sum + (r.rejection_count || 0) : sum;
    }, 0);
    return { weekday: day, count };
  });

  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">統計分析</h1>
            <p className="text-stone-600 mt-1">曜日別の客数・スタッフ数・お断り数</p>
          </div>
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
        </div>

        {/* サマリーカード */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-stone-600 mb-1">総施術数</p>
              <p className="text-3xl font-bold text-blue-900">{monthTreatments.length}</p>
              <p className="text-xs text-stone-500 mt-1">件</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-stone-600 mb-1">平均スタッフ数/日</p>
              <p className="text-3xl font-bold text-green-900">
                {(staffByWeekday.reduce((sum, d) => sum + d.avgStaff, 0) / 7).toFixed(1)}
              </p>
              <p className="text-xs text-stone-500 mt-1">人</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm text-stone-600 mb-1">総お断り数</p>
              <p className="text-3xl font-bold text-red-900">
                {rejectionsByWeekday.reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-stone-500 mt-1">件</p>
            </CardContent>
          </Card>
        </div>

        {/* 曜日別客数 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              曜日別客数（施術実績）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customersByWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="weekday" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="客数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 曜日別スタッフ出勤数 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              曜日別スタッフ出勤数（平均）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffByWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="weekday" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgStaff" fill="#10b981" name="平均出勤人数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 曜日別お断り数 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              曜日別お断り数
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rejectionsByWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="weekday" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="お断り数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 曜日別比較表 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800">
              曜日別サマリー
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-stone-200">
                    <th className="text-left p-3 text-sm font-semibold">曜日</th>
                    <th className="text-center p-3 text-sm font-semibold">客数</th>
                    <th className="text-center p-3 text-sm font-semibold">平均スタッフ数</th>
                    <th className="text-center p-3 text-sm font-semibold">お断り数</th>
                    <th className="text-center p-3 text-sm font-semibold">客数/スタッフ</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKDAYS.map((day, index) => {
                    const customers = customersByWeekday[index].count;
                    const staff = staffByWeekday[index].avgStaff;
                    const rejections = rejectionsByWeekday[index].count;
                    const ratio = staff > 0 ? (customers / staff).toFixed(1) : 0;
                    
                    return (
                      <tr key={day} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="p-3 font-semibold">{day}曜日</td>
                        <td className="text-center p-3">{customers}件</td>
                        <td className="text-center p-3">{staff}人</td>
                        <td className="text-center p-3 text-red-700 font-semibold">{rejections}件</td>
                        <td className="text-center p-3 text-blue-700 font-semibold">{ratio}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}