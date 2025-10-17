import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneOff, Edit, Save, X, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function RejectionCounter({ 
  todayRejections, 
  monthlyRejections, 
  isLoading, 
  onUpdate 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todayRejections?.rejection_count || 0);
  const [notes, setNotes] = useState(todayRejections?.notes || "");

  const handleSave = async () => {
    await onUpdate({
      rejection_count: parseInt(editValue) || 0,
      notes: notes
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(todayRejections?.rejection_count || 0);
    setNotes(todayRejections?.notes || "");
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const todayCount = todayRejections?.rejection_count || 0;
  const monthlyCount = monthlyRejections || 0;

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <PhoneOff className="w-5 h-5 text-red-600" />
            お断り数
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                本日のお断り数
              </label>
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="0"
                className="text-2xl font-bold text-center"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                備考
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="理由やメモ（任意）"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 本日のお断り数 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
              <p className="text-sm text-red-700 mb-2">本日</p>
              <motion.div
                key={todayCount}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-red-900"
              >
                {todayCount}
              </motion.div>
              <p className="text-sm text-red-600 mt-2">件</p>
              {todayRejections?.notes && (
                <p className="text-xs text-stone-600 mt-3 p-2 bg-white/50 rounded">
                  {todayRejections.notes}
                </p>
              )}
            </div>

            {/* 今月の合計 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-600 mb-1">今月合計</p>
                <p className="text-2xl font-bold text-stone-800">{monthlyCount}</p>
                <p className="text-xs text-stone-500">件</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-600 mb-1">月平均（日割り）</p>
                <p className="text-2xl font-bold text-stone-800">
                  {(monthlyCount / new Date().getDate()).toFixed(1)}
                </p>
                <p className="text-xs text-stone-500">件/日</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}