
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, RefreshCw, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200"
};

const statusLabels = {
  confirmed: "確認済み",
  completed: "完了",
  cancelled: "キャンセル",
  no_show: "来店なし"
};

export default function TodayAppointments({ appointments, isLoading, onRefresh }) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-stone-800">
            本日の予約
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRefresh}
            className="hover:bg-amber-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600">本日の予約はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt, index) => (
              <div 
                key={apt.id}
                className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-amber-50/30 border border-stone-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-stone-500" />
                    <span className="font-semibold text-stone-800">
                      {apt.customer_name}
                    </span>
                  </div>
                  <Badge className={`${statusColors[apt.status]} border text-xs`}>
                    {statusLabels[apt.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{apt.appointment_time}</span>
                  </div>
                  <span className="text-stone-400">•</span>
                  <span>{apt.service_menu}</span>
                  <span className="text-stone-400">•</span>
                  <span>{apt.duration}分</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link to={createPageUrl("Appointments")}>
            <Button variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50">
              すべての予約を見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
