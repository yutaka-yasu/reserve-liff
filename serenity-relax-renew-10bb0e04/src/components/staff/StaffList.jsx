
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Calendar, Edit, Trash2, UserCog, Clock, DollarSign, FileText, TrendingUp, Printer, Star } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

const positionColors = {
  "セラピスト": "bg-blue-100 text-blue-800 border-blue-200",
  "チーフセラピスト": "bg-purple-100 text-purple-800 border-purple-200",
  "マネージャー": "bg-amber-100 text-amber-800 border-amber-200",
  "受付": "bg-green-100 text-green-800 border-green-200",
  "その他": "bg-gray-100 text-gray-800 border-gray-200"
};

const roleColors = {
  "管理者": "bg-red-100 text-red-800 border-red-200",
  "一般スタッフ": "bg-blue-100 text-blue-800 border-blue-200",
  "閲覧のみ": "bg-gray-100 text-gray-800 border-gray-200"
};

export default function StaffList({ staff, isLoading, onEdit, onDelete, onToggleActive, calculateStaffStats, calculateTotalStats, selectedMonth, onPrintReceipt }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
        <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
          <UserCog className="w-10 h-10 text-stone-400" />
        </div>
        <p className="text-stone-600 text-lg">スタッフが見つかりません</p>
      </Card>
    );
  }

  // 月の表示用フォーマット
  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {staff.map((member, index) => {
        const stats = calculateStaffStats(member.id);
        const totalStats = calculateTotalStats(member.id);
        const storeShare = stats.totalRevenue - stats.commission;
        
        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`
              border-0 shadow-lg backdrop-blur-sm transition-all duration-300
              ${member.is_active 
                ? 'bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl' 
                : 'bg-gray-100 opacity-60'
              }
            `}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                      style={{ width: "48px", height: "48px", minWidth: "48px", flexShrink: 0 }}
                    >
                      {member.name?.[0] || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="font-bold text-base sm:text-lg text-stone-800" style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {member.name}
                      </h3>
                      {member.name_kana && (
                        <p className="text-xs sm:text-sm text-stone-500" style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {member.name_kana}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {member.position && (
                          <Badge className={`${positionColors[member.position]} border text-xs`}>
                            {member.position}
                          </Badge>
                        )}
                        {member.employment_type && (
                          <Badge className={`${
                            member.employment_type === "助っ人" 
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : member.employment_type === "パート"
                              ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          } border text-xs`}>
                            {member.employment_type}
                          </Badge>
                        )}
                        {member.role && (
                          <Badge className={`${roleColors[member.role]} border text-xs`}>
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => onDelete(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* 累計勤務時間 */}
                <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    累計実績（全期間）
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">勤務日数</span>
                      <span className="font-bold text-blue-900">{totalStats.workDays}日</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">勤務時間</span>
                      <span className="font-bold text-blue-900">
                        {totalStats.workHours}時間{totalStats.workRemainingMinutes > 0 && `${totalStats.workRemainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        施術時間
                      </span>
                      <span className="font-bold text-indigo-900">
                        {totalStats.totalHours}時間{totalStats.remainingMinutes > 0 && `${totalStats.remainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">待機時間</span>
                      <span className="font-bold text-orange-900">
                        {totalStats.waitingHours}時間{totalStats.waitingRemainingMinutes > 0 && `${totalStats.waitingRemainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200">
                      <span className="text-blue-700">施術回数</span>
                      <span className="font-bold text-blue-900">{totalStats.treatmentCount}回</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        指名回数
                      </span>
                      <span className="font-bold text-amber-900">
                        {totalStats.nominationCount}回 ({totalStats.nominationRate}%)
                      </span>
                    </div>
                    {totalStats.totalRevenue > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200">
                        <span className="text-blue-700">累計売上貢献</span>
                        <span className="font-bold text-green-900">
                          ¥{totalStats.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 月次施術統計 */}
                <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  <h4 className="text-xs font-semibold text-indigo-900 mb-3 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {monthDisplay}の実績
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700">勤務日数</span>
                      <span className="font-bold text-indigo-900">{stats.workDays}日</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700">勤務時間</span>
                      <span className="font-bold text-indigo-900">
                        {stats.workHours}時間{stats.workRemainingMinutes > 0 && `${stats.workRemainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        施術時間
                      </span>
                      <span className="font-bold text-purple-900">
                        {stats.totalHours}時間{stats.remainingMinutes > 0 && `${stats.remainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700">待機時間</span>
                      <span className="font-bold text-orange-900">
                        {stats.waitingHours}時間{stats.waitingRemainingMinutes > 0 && `${stats.waitingRemainingMinutes}分`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-indigo-200">
                      <span className="text-indigo-700">施術回数</span>
                      <span className="font-bold text-indigo-900">{stats.treatmentCount}回</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        指名回数
                      </span>
                      <span className="font-bold text-amber-900">
                        {stats.nominationCount}回 ({stats.nominationRate}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-700">総施術分数</span>
                      <span className="font-bold text-indigo-900">{stats.totalMinutes}分</span>
                    </div>
                    {member.position === "マネージャー" && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-700">時間比率</span>
                        <span className="font-bold text-purple-900">{stats.timeRatio}%</span>
                      </div>
                    )}
                    {stats.totalRevenue > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-indigo-200">
                        <span className="text-indigo-700 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          売上貢献
                        </span>
                        <span className="font-bold text-indigo-900">
                          ¥{stats.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {stats.commission > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-indigo-200 bg-gradient-to-r from-amber-50 to-orange-50 -mx-2 px-2 py-2 rounded">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          報酬額
                        </span>
                        <span className="font-bold text-lg text-amber-900">
                          ¥{stats.commission.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {storeShare > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-indigo-200 bg-gradient-to-r from-green-50 to-emerald-50 -mx-2 px-2 py-2 rounded">
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          店舗取り分
                        </span>
                        <span className="font-bold text-lg text-emerald-900">
                          ¥{storeShare.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-2 rounded bg-purple-50 border border-purple-200">
                    <p className="text-xs text-purple-900">
                      {member.position === "マネージャー" 
                        ? `総売上25%${stats.timeRatio > 0 ? ` × MGR比率${stats.timeRatio}%` : ''}`
                        : `${stats.totalMinutes}分 × ¥25/分`
                      }
                    </p>
                  </div>
                </div>

                {/* 印刷ボタン */}
                {stats.treatmentCount > 0 && (
                  <Button
                    onClick={() => onPrintReceipt(member, stats)}
                    variant="outline"
                    className="w-full mb-3 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    報酬明細を印刷
                  </Button>
                )}

                {member.notes && (
                  <div className="mb-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
                    <p className="text-xs text-stone-600 line-clamp-2">{member.notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    {member.is_active ? "在籍中" : "退職"}
                  </span>
                  <Switch
                    checked={member.is_active}
                    onCheckedChange={() => onToggleActive(member)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
