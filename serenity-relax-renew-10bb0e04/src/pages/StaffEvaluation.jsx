
import React, { useState, useEffect } from "react";
import { Treatment, Staff, User, Attendance } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Star, Calendar, Award, Shield, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function StaffEvaluation() {
  const [staff, setStaff] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);

  useEffect(() => {
    loadCurrentStaff();
  }, []);

  useEffect(() => {
    if (currentStaffInfo && currentStaffInfo.role === "管理者") {
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
    const [staffData, treatmentData, attendanceData] = await Promise.all([
      Staff.list(),
      Treatment.list("-treatment_date"),
      Attendance.list()
    ]);
    setStaff(staffData);
    setTreatments(treatmentData);
    setAttendances(attendanceData);
    setIsLoading(false);
  };

  const calculateEvaluation = (staffId) => {
    // 選択月のデータのみフィルター
    const monthTreatments = treatments.filter(t => {
      const treatmentDate = new Date(t.treatment_date);
      const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
      return treatmentMonth === selectedMonth;
    });

    const staffTreatments = monthTreatments.filter(t => t.staff_id === staffId);
    
    // 売上貢献
    const totalRevenue = staffTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
    const allRevenue = monthTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
    const revenueRate = allRevenue > 0 ? ((totalRevenue / allRevenue) * 100).toFixed(1) : 0;
    
    // 指名率
    const treatmentCount = staffTreatments.length;
    const nominationCount = staffTreatments.filter(t => t.is_nominated).length;
    const nominationRate = treatmentCount > 0 ? ((nominationCount / treatmentCount) * 100).toFixed(1) : 0;
    
    // 出勤日数（Attendanceエンティティから取得）
    const monthAttendances = attendances.filter(a => {
      const attDate = new Date(a.attendance_date);
      const attMonth = `${attDate.getFullYear()}-${String(attDate.getMonth() + 1).padStart(2, '0')}`;
      return attMonth === selectedMonth && a.staff_id === staffId && a.work_type === "出勤";
    });
    const workDays = monthAttendances.length;
    
    // 施術時間
    const totalMinutes = staffTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    // スタッフ情報を取得
    const staffMember = staff.find(s => s.id === staffId);
    
    // ランク判定（マネージャー以外のみ）
    let rank = null;
    let rankColor = '';
    
    if (staffMember && staffMember.position !== "マネージャー") {
      rank = 'C';
      rankColor = 'bg-gray-100 text-gray-800 border-gray-300';
      
      const revenue = parseFloat(revenueRate);
      const nomination = parseFloat(nominationRate);
      
      // Sランク: 売上貢献度50%以上 AND 指名率30%以上 AND 出勤日数20日以上
      if (revenue >= 50 && nomination >= 30 && workDays >= 20) {
        rank = 'S';
        rankColor = 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600';
      }
      // Aランク: 売上貢献度30%以上 AND 指名率30%以上 AND 出勤日数13日以上 (ただし売上貢献度50%未満またはS基準未満)
      else if (revenue >= 30 && nomination >= 30 && workDays >= 13) {
        rank = 'A';
        rankColor = 'bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 border-yellow-500';
      }
      // Bランク: 売上貢献度10%以上 AND 指名率10%以上 AND 出勤日数10日以上 (ただしAランク条件を満たさない)
      else if (revenue >= 10 && nomination >= 10 && workDays >= 10) {
        rank = 'B';
        rankColor = 'bg-gradient-to-r from-blue-400 to-cyan-400 text-blue-900 border-blue-500';
      }
      // Cランク: それ以外
    }
    
    return {
      totalRevenue,
      revenueRate,
      nominationCount,
      nominationRate,
      treatmentCount,
      workDays,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
      rank,
      rankColor
    };
  };

  const handlePrintEvaluation = () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const monthDisplay = `${year}年${month}月`;
      
      // 全スタッフの評価データを計算（マネージャー以外のみ）
      const activeStaff = staff.filter(s => s.is_active && s.position !== "マネージャー");
      const evaluationData = activeStaff.map(member => ({
        ...member,
        evaluation: calculateEvaluation(member.id)
      })).filter(s => s.evaluation.treatmentCount > 0)
        .sort((a, b) => b.evaluation.totalRevenue - a.evaluation.totalRevenue);

      const totalRevenue = evaluationData.reduce((sum, s) => sum + s.evaluation.totalRevenue, 0);

      const printWindow = window.open('', '_blank');
      
      // ポップアップブロッカーでブロックされた場合
      if (!printWindow) {
        alert('ポップアップブロックを解除してください。\nブラウザのアドレスバー右側のアイコンから、このサイトのポップアップを許可してください。');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>スタッフ査定表 - ${monthDisplay}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 15mm; }
            }
            body {
              font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #4f46e5;
              font-size: 28px;
            }
            .header .period {
              font-size: 18px;
              color: #666;
              margin-top: 10px;
            }
            .summary {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary-row:last-child {
              border-bottom: none;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #4f46e5;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background: #f8f9fa;
            }
            .rank-1 { background: #fef3c7 !important; }
            .rank-2 { background: #e5e7eb !important; }
            .rank-3 { background: #fed7aa !important; }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 スタッフ査定表</h1>
            <div class="period">${monthDisplay}</div>
          </div>

          <div class="summary">
            <h2 style="margin: 0 0 15px 0; color: #4f46e5;">店舗全体サマリー</h2>
            <div class="summary-row">
              <span><strong>総売上</strong></span>
              <span><strong>¥${totalRevenue.toLocaleString()}</strong></span>
            </div>
            <div class="summary-row">
              <span><strong>稼働スタッフ数</strong></span>
              <span><strong>${evaluationData.length}名</strong></span>
            </div>
            <div class="summary-row">
              <span><strong>発行日</strong></span>
              <span>${new Date().toLocaleDateString('ja-JP')}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>順位</th>
                <th>ランク</th>
                <th>スタッフ名</th>
                <th>役職</th>
                <th class="text-right">売上額</th>
                <th class="text-center">貢献度</th>
                <th class="text-center">施術回数</th>
                <th class="text-center">指名回数</th>
                <th class="text-center">指名率</th>
                <th class="text-center">施術時間</th>
                <th class="text-center">出勤日数</th>
              </tr>
            </thead>
            <tbody>
              ${evaluationData.map((member, index) => {
                const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
                const rankLabel = member.evaluation.rank;
                const rankStyle = rankLabel === 'S' ? 'background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; font-weight: bold;' :
                                 rankLabel === 'A' ? 'background: #fbbf24; color: #78350f; font-weight: bold;' :
                                 rankLabel === 'B' ? 'background: #60a5fa; color: #1e3a8a; font-weight: bold;' :
                                 'background: #9ca3af; color: #1f2937; font-weight: bold;';
                return `
                  <tr class="${rankClass}">
                    <td class="text-center"><strong>${index + 1}</strong></td>
                    <td class="text-center"><span style="padding: 4px 12px; border-radius: 6px; ${rankStyle}">${rankLabel}</span></td>
                    <td><strong>${member.name}</strong></td>
                    <td>${member.position || '-'}</td>
                    <td class="text-right"><strong>¥${member.evaluation.totalRevenue.toLocaleString()}</strong></td>
                    <td class="text-center">${member.evaluation.revenueRate}%</td>
                    <td class="text-center">${member.evaluation.treatmentCount}回</td>
                    <td class="text-center">${member.evaluation.nominationCount}回</td>
                    <td class="text-center"><strong>${member.evaluation.nominationRate}%</strong></td>
                    <td class="text-center">${member.evaluation.totalHours}h${member.evaluation.remainingMinutes}m</td>
                    <td class="text-center">${member.evaluation.workDays}日</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-top: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">📊 ランク評価基準</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #a855f7;">
                <div style="font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px;">Sランク</div>
                <div style="font-size: 14px; color: #7c3aed;">
                  ✓ 売上貢献度 50%以上<br>
                  ✓ 指名率 30%以上<br>
                  ✓ 出勤日数 20日以上
                </div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #fbbf24;">
                <div style="font-size: 24px; font-weight: bold; color: #78350f; margin-bottom: 8px;">Aランク</div>
                <div style="font-size: 14px; color: #92400e;">
                  ✓ 売上貢献度 30%以上<br>
                  ✓ 指名率 30%以上<br>
                  ✓ 出勤日数 13日以上
                </div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #60a5fa;">
                <div style="font-size: 24px; font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">Bランク</div>
                <div style="font-size: 14px; color: #1e40af;">
                  ✓ 売上貢献度 10%以上<br>
                  ✓ 指名率 10%以上<br>
                  ✓ 出勤日数 10日以上
                </div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border: 2px solid #9ca3af;">
                <div style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Cランク</div>
                <div style="font-size: 14px; color: #374151;">
                  ✓ 上記以外
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>ゆたか三田三輪店</p>
            <p>この査定表は${new Date().toLocaleString('ja-JP')}に発行されました</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("印刷エラー:", error);
      alert("印刷に失敗しました: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center animate-pulse">
            <Award className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

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

  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  // マネージャー以外のスタッフのみ評価対象
  const activeStaff = staff.filter(s => s.is_active && s.position !== "マネージャー");
  const evaluationData = activeStaff.map(member => ({
    ...member,
    evaluation: calculateEvaluation(member.id)
  })).filter(s => s.evaluation.treatmentCount > 0)
    .sort((a, b) => b.evaluation.totalRevenue - a.evaluation.totalRevenue);

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">スタッフ査定表</h1>
            <p className="text-stone-600 mt-1">パフォーマンス評価・貢献度分析</p>
          </div>
          <div className="flex gap-3">
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
            <Button
              onClick={handlePrintEvaluation}
              className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white shadow-lg"
            >
              <Printer className="w-5 h-5 mr-2" />
              印刷
            </Button>
          </div>
        </div>

        {evaluationData.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-stone-400" />
            </div>
            <p className="text-stone-600 text-lg">{monthDisplay}のデータがありません</p>
          </Card>
        ) : (
          <>
            {/* ランク評価基準 */}
            <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-xl font-bold text-stone-800">📊 ランク評価基準</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Sランク</div>
                    <div className="text-sm text-purple-900 space-y-1">
                      <div>✓ 売上貢献度 50%以上</div>
                      <div>✓ 指名率 30%以上</div>
                      <div>✓ 出勤日数 20日以上</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-400">
                    <div className="text-3xl font-bold text-yellow-900 mb-2">Aランク</div>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <div>✓ 売上貢献度 30%以上</div>
                      <div>✓ 指名率 30%以上</div>
                      <div>✓ 出勤日数 13日以上</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-400">
                    <div className="text-3xl font-bold text-blue-900 mb-2">Bランク</div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>✓ 売上貢献度 10%以上</div>
                      <div>✓ 指名率 10%以上</div>
                      <div>✓ 出勤日数 10日以上</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 border-2 border-gray-400">
                    <div className="text-3xl font-bold text-gray-900 mb-2">Cランク</div>
                    <div className="text-sm text-gray-800 space-y-1">
                      <div>✓ 上記以外</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {evaluationData.map((member, index) => {
                const rankColors = {
                  0: 'from-yellow-100 to-amber-100 border-yellow-300',
                  1: 'from-gray-100 to-slate-100 border-gray-300',
                  2: 'from-orange-100 to-red-100 border-orange-300'
                };
                const rankBadge = {
                  0: { emoji: '🥇', text: '1位', color: 'bg-yellow-500 text-white' },
                  1: { emoji: '🥈', text: '2位', color: 'bg-gray-400 text-white' },
                  2: { emoji: '🥉', text: '3位', color: 'bg-orange-500 text-white' }
                };

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border-2 shadow-xl bg-gradient-to-br ${rankColors[index] || 'from-white to-indigo-50/30 border-indigo-100'}`}>
                      <CardHeader className="border-b border-stone-200 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
                                {member.name?.[0] || "?"}
                              </div>
                              {index < 3 && (
                                <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-bold shadow-md ${rankBadge[index].color}`}>
                                  {rankBadge[index].emoji} {rankBadge[index].text}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-2xl font-bold text-stone-800">{member.name}</h3>
                                <Badge className={`${member.evaluation.rankColor} border-2 text-lg px-3 py-1 font-bold shadow-md`}>
                                  {member.evaluation.rank}ランク
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {member.position && (
                                  <Badge variant="outline" className="text-xs border-purple-200 bg-purple-50 text-purple-800">
                                    {member.position}
                                  </Badge>
                                )}
                                {member.role && (
                                  <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-800">
                                    {member.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-stone-600">総売上</div>
                            <div className="text-3xl font-bold text-green-900">
                              ¥{member.evaluation.totalRevenue.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                          <div className="p-4 rounded-xl bg-white/70 border border-green-200">
                            <div className="flex items-center gap-2 text-green-700 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-semibold">売上貢献度</span>
                            </div>
                            <div className="text-3xl font-bold text-green-900">{member.evaluation.revenueRate}%</div>
                            <div className="text-xs text-stone-600 mt-1">店舗全体に対する割合</div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/70 border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-700 mb-2">
                              <Star className="w-4 h-4 fill-amber-500" />
                              <span className="text-sm font-semibold">指名率</span>
                            </div>
                            <div className="text-3xl font-bold text-amber-900">{member.evaluation.nominationRate}%</div>
                            <div className="text-xs text-stone-600 mt-1">
                              {member.evaluation.nominationCount}/{member.evaluation.treatmentCount}回
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/70 border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-700 mb-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-semibold">出勤日数</span>
                            </div>
                            <div className="text-3xl font-bold text-blue-900">{member.evaluation.workDays}日</div>
                            <div className="text-xs text-stone-600 mt-1">出勤した日数</div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/70 border border-purple-200">
                            <div className="flex items-center gap-2 text-purple-700 mb-2">
                              <Award className="w-4 h-4" />
                              <span className="text-sm font-semibold">施術回数</span>
                            </div>
                            <div className="text-3xl font-bold text-purple-900">{member.evaluation.treatmentCount}回</div>
                            <div className="text-xs text-stone-600 mt-1">
                              {member.evaluation.totalHours}時間{member.evaluation.remainingMinutes}分
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/70 border border-indigo-200">
                            <div className="flex items-center gap-2 text-indigo-700 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-semibold">1日平均売上</span>
                            </div>
                            <div className="text-2xl font-bold text-indigo-900">
                              ¥{member.evaluation.workDays > 0 
                                ? Math.round(member.evaluation.totalRevenue / member.evaluation.workDays).toLocaleString()
                                : 0
                              }
                            </div>
                            <div className="text-xs text-stone-600 mt-1">出勤日あたり</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
