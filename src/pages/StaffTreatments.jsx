import React, { useState, useEffect } from "react";
import { Treatment, Staff, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Calendar, Clock, DollarSign, TrendingUp, Star, FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

export default function StaffTreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [treatmentData, staffData] = await Promise.all([
        Treatment.list("-treatment_date"),
        Staff.list()
      ]);
      setTreatments(treatmentData);
      setStaff(staffData.filter(s => s.is_active));
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setIsLoading(false);
  };

  const filteredTreatments = treatments.filter(t => {
    const staffMatch = !selectedStaffId || t.staff_id === selectedStaffId;
    
    if (selectedMonth) {
      const treatmentDate = new Date(t.treatment_date);
      const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
      return staffMatch && treatmentMonth === selectedMonth;
    }
    
    return staffMatch;
  });

  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  // 統計計算
  const stats = {
    totalTreatments: filteredTreatments.length,
    totalRevenue: filteredTreatments.reduce((sum, t) => sum + (t.price || 0), 0),
    totalMinutes: filteredTreatments.reduce((sum, t) => sum + (t.duration || 0), 0),
    nominationCount: filteredTreatments.filter(t => t.is_nominated).length,
    nominationRate: filteredTreatments.length > 0 
      ? ((filteredTreatments.filter(t => t.is_nominated).length / filteredTreatments.length) * 100).toFixed(1)
      : 0
  };

  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">スタッフ別施術一覧</h1>
          <p className="text-stone-600">スタッフごとの施術履歴を確認</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">スタッフ選択</label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="bg-white border-stone-200">
                <SelectValue placeholder="スタッフを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} {member.position && `(${member.position})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">期間選択</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-white border-stone-200">
                <SelectValue />
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
        </div>

        {selectedStaffId ? (
          <>
            {/* 統計サマリー */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-900 font-medium">施術回数</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalTreatments}回</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-900 font-medium">総売上</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">¥{stats.totalRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-purple-900 font-medium">総施術時間</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.floor(stats.totalMinutes / 60)}h{stats.totalMinutes % 60}m
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
                    <span className="text-sm text-amber-900 font-medium">指名回数</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{stats.nominationCount}回</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-indigo-900 font-medium">指名率</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{stats.nominationRate}%</p>
                </CardContent>
              </Card>
            </div>

            {/* スタッフ情報 */}
            {selectedStaff && (
              <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {selectedStaff.name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-stone-800">{selectedStaff.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {selectedStaff.position && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            {selectedStaff.position}
                          </Badge>
                        )}
                        {selectedStaff.role && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {selectedStaff.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm text-stone-600">表示期間</p>
                      <p className="text-lg font-bold text-stone-800">{monthDisplay}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 施術一覧 */}
            {filteredTreatments.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-stone-400" />
                </div>
                <p className="text-stone-600 text-lg">
                  {monthDisplay}の施術データがありません
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTreatments.map((treatment, index) => (
                  <motion.div
                    key={treatment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="w-5 h-5 text-indigo-600" />
                              <span className="text-lg font-bold text-stone-800">
                                {format(new Date(treatment.treatment_date), 'yyyy年MM月dd日 (E)', { locale: ja })}
                              </span>
                              {treatment.is_nominated && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  <Star className="w-3 h-3 mr-1 fill-amber-600" />
                                  指名
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2 ml-8">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-stone-600">顧客:</span>
                                <span className="font-semibold text-stone-800">{treatment.customer_name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-stone-600">メニュー:</span>
                                <span className="text-stone-800">{treatment.service_menu}</span>
                              </div>

                              {treatment.chief_complaint && (
                                <div className="flex items-start gap-2">
                                  <span className="text-sm text-stone-600">主訴:</span>
                                  <span className="text-stone-700 text-sm">{treatment.chief_complaint}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex md:flex-col gap-4 md:gap-2 md:items-end">
                            <div className="text-center">
                              <p className="text-xs text-stone-600 mb-1">施術時間</p>
                              <p className="text-lg font-bold text-purple-900">{treatment.duration}分</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-stone-600 mb-1">料金</p>
                              <p className="text-xl font-bold text-green-900">¥{treatment.price?.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <UserCog className="w-10 h-10 text-indigo-600" />
            </div>
            <p className="text-stone-600 text-lg">スタッフを選択してください</p>
          </Card>
        )}
      </div>
    </div>
  );
}