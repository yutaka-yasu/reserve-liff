
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, TrendingDown, Edit, Save, X, BarChart3 } from "lucide-react";
import { MonthlyTarget } from "@/api/entities";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function TargetProgress({ monthlyTarget, currentRevenue, lastMonthRevenue, isLoading, onRefresh, treatments }) {
  const [isEditing, setIsEditing] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [previousRevenue, setPreviousRevenue] = useState("");
  const [showLastMonthChart, setShowLastMonthChart] = useState(false);

  // monthlyTargetが変更されたら入力フィールドを更新
  useEffect(() => {
    if (monthlyTarget) {
      setTargetAmount(monthlyTarget.target_amount.toString());
      setPreviousRevenue(
        monthlyTarget.previous_month_revenue !== null && monthlyTarget.previous_month_revenue !== undefined
          ? monthlyTarget.previous_month_revenue.toString()
          : (lastMonthRevenue || "").toString()
      );
    } else {
      setTargetAmount("");
      setPreviousRevenue((lastMonthRevenue || "").toString());
    }
  }, [monthlyTarget, lastMonthRevenue]);

  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  // 日割り計算
  const dailyTarget = monthlyTarget ? Math.round(monthlyTarget.target_amount / daysInMonth) : 0;
  const expectedRevenueByToday = dailyTarget * currentDay;
  const achievementRate = monthlyTarget ? ((currentRevenue / monthlyTarget.target_amount) * 100).toFixed(1) : 0;
  const dailyAchievementRate = monthlyTarget && expectedRevenueByToday > 0 
    ? ((currentRevenue / expectedRevenueByToday) * 100).toFixed(1) 
    : 0;
  
  const isOnTrack = dailyAchievementRate >= 100;
  const difference = currentRevenue - expectedRevenueByToday;

  // 先月比計算（保存された値があればそれを使用、なければ計算値を使用）
  const displayLastMonthRevenue = 
    monthlyTarget?.previous_month_revenue !== null && monthlyTarget?.previous_month_revenue !== undefined
      ? monthlyTarget.previous_month_revenue
      : (lastMonthRevenue || 0);
  
  const monthOverMonthDiff = currentRevenue - displayLastMonthRevenue;
  const monthOverMonthRate = displayLastMonthRevenue > 0 
    ? ((monthOverMonthDiff / displayLastMonthRevenue) * 100).toFixed(1)
    : 0;
  const isGrowth = monthOverMonthDiff >= 0;

  // 先月の日別売上データを計算
  const calculateLastMonthDailyRevenue = () => {
    if (!treatments || treatments.length === 0) return [];
    
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthYear = lastMonth.getFullYear();
    const lastMonthNum = lastMonth.getMonth();
    const daysInLastMonth = new Date(lastMonthYear, lastMonthNum + 1, 0).getDate();
    
    // 日別売上を初期化
    const dailyRevenue = {};
    for (let day = 1; day <= daysInLastMonth; day++) {
      dailyRevenue[day] = 0;
    }
    
    // 先月の施術データをフィルターして日別に集計
    treatments.forEach(t => {
      const treatmentDate = new Date(t.treatment_date);
      if (treatmentDate.getFullYear() === lastMonthYear && 
          treatmentDate.getMonth() === lastMonthNum) {
        const day = treatmentDate.getDate();
        dailyRevenue[day] += (t.price || 0);
      }
    });
    
    // グラフ用のデータに変換
    return Object.keys(dailyRevenue).map(day => ({
      day: `${day}日`,
      売上: dailyRevenue[day]
    }));
  };

  const lastMonthDailyData = calculateLastMonthDailyRevenue();

  const handleSave = async () => {
    try {
      if (!targetAmount || targetAmount === "") {
        alert("目標金額を入力してください");
        return;
      }

      const currentMonth = today.toISOString().slice(0, 7);
      const targetData = {
        target_month: currentMonth,
        target_amount: parseFloat(targetAmount),
        previous_month_revenue: previousRevenue && previousRevenue !== "" ? parseFloat(previousRevenue) : null
      };

      console.log("Saving target data:", targetData); // デバッグ用

      if (monthlyTarget) {
        await MonthlyTarget.update(monthlyTarget.id, targetData);
      } else {
        await MonthlyTarget.create(targetData);
      }
      
      setIsEditing(false);
      await onRefresh(); // データを再読み込み
      alert("目標を保存しました");
    } catch (error) {
      console.error("目標保存エラー:", error);
      alert("目標の保存に失敗しました: " + error.message);
    }
  };

  const handleEditClick = () => {
    setTargetAmount(monthlyTarget?.target_amount?.toString() || "");
    setPreviousRevenue(
      monthlyTarget?.previous_month_revenue !== null && monthlyTarget?.previous_month_revenue !== undefined
        ? monthlyTarget.previous_month_revenue.toString()
        : (lastMonthRevenue || "").toString()
    );
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            今月の目標達成状況
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              目標設定
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                月次売上目標（円）
              </label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="3000000"
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                先月売上（円）
              </label>
              <Input
                type="number"
                value={previousRevenue}
                onChange={(e) => setPreviousRevenue(e.target.value)}
                placeholder={lastMonthRevenue ? lastMonthRevenue.toString() : "2500000"}
                className="text-lg"
              />
              <p className="text-xs text-stone-500 mt-1">
                ※ データから自動計算: ¥{(lastMonthRevenue || 0).toLocaleString()}
                {monthlyTarget?.previous_month_revenue !== null && monthlyTarget?.previous_month_revenue !== undefined && (
                  <span className="text-green-600 ml-2">（手動設定済み）</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
            </div>
          </div>
        ) : monthlyTarget ? (
          <div className="space-y-6">
            {/* 月次目標 */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">月次目標</p>
                <p className="text-2xl font-bold text-indigo-900">
                  ¥{monthlyTarget.target_amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">現在の売上</p>
                <p className="text-2xl font-bold text-purple-900">
                  ¥{currentRevenue.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">達成率</p>
                <p className={`text-3xl font-bold ${
                  achievementRate >= 100 ? 'text-green-600' : 
                  achievementRate >= 80 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {achievementRate}%
                </p>
              </div>
            </div>

            {/* プログレスバー */}
            <div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    achievementRate >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    achievementRate >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                    'bg-gradient-to-r from-red-500 to-pink-400'
                  }`}
                  style={{ width: `${Math.min(achievementRate, 100)}%` }}
                />
              </div>
            </div>

            {/* 先月比較 */}
            <div className="p-4 rounded-xl bg-white/70 border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  📊 先月比較
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLastMonthChart(!showLastMonthChart)}
                  className="text-indigo-700 hover:bg-indigo-50"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {showLastMonthChart ? '閉じる' : '日別グラフ'}
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-stone-600">先月売上</p>
                  <p className="font-bold text-stone-800">
                    ¥{displayLastMonthRevenue.toLocaleString()}
                  </p>
                  {monthlyTarget?.previous_month_revenue !== null && monthlyTarget?.previous_month_revenue !== undefined ? (
                    <p className="text-xs text-green-600 mt-1">（手動設定）</p>
                  ) : (
                    <p className="text-xs text-stone-500 mt-1">（自動計算）</p>
                  )}
                </div>
                <div>
                  <p className="text-stone-600">今月売上</p>
                  <p className="font-bold text-stone-800">
                    ¥{currentRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-stone-600">増減</p>
                  <div className="flex items-center gap-2">
                    {isGrowth ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-bold text-lg ${isGrowth ? 'text-green-600' : 'text-red-600'}`}>
                        {isGrowth ? '+' : ''}{monthOverMonthRate}%
                      </p>
                      <p className={`text-xs ${isGrowth ? 'text-green-700' : 'text-red-700'}`}>
                        {isGrowth ? '+' : ''}¥{monthOverMonthDiff.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 先月の日別売上グラフ */}
              {showLastMonthChart && lastMonthDailyData.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-100">
                  <h5 className="text-sm font-semibold text-indigo-900 mb-3">先月の日別売上推移</h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={lastMonthDailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`¥${value.toLocaleString()}`, '売上']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #c7d2fe' }}
                      />
                      <Bar dataKey="売上" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 日割り計算 */}
            <div className="p-4 rounded-xl bg-white/50 border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                {isOnTrack ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                日割り進捗（{currentDay}日/{daysInMonth}日経過）
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-stone-600">日割り目標</p>
                  <p className="font-bold text-stone-800">
                    ¥{dailyTarget.toLocaleString()}/日
                  </p>
                </div>
                <div>
                  <p className="text-stone-600">今日までの目標</p>
                  <p className="font-bold text-stone-800">
                    ¥{expectedRevenueByToday.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-stone-600">達成率</p>
                  <p className={`font-bold text-lg ${
                    isOnTrack ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dailyAchievementRate}%
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                <p className={`text-sm font-medium ${
                  isOnTrack ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isOnTrack ? (
                    <>
                      ✨ 目標をクリアしています！
                      <span className="ml-2">+¥{Math.abs(difference).toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      ⚠️ 目標まであと
                      <span className="ml-2 font-bold">¥{Math.abs(difference).toLocaleString()}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
            <p className="text-stone-600 mb-4">今月の売上目標が設定されていません</p>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              目標を設定する
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
