import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, RefreshCw, DollarSign, Clock, Star, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isToday } from "date-fns";

const pressureLevelColors = {
  "弱め": "bg-blue-100 text-blue-800 border-blue-200",
  "普通": "bg-green-100 text-green-800 border-green-200",
  "強め": "bg-red-100 text-red-800 border-red-200"
};

export default function TodayTreatments({ treatments, isLoading, onRefresh }) {
  // 本日の施術のみフィルター
  const todayTreatments = treatments.filter(treatment => 
    isToday(new Date(treatment.treatment_date))
  );

  // 本日の合計金額を計算
  const totalRevenue = todayTreatments.reduce((sum, treatment) => sum + (treatment.price || 0), 0);
  const totalTreatments = todayTreatments.length;

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-stone-800">
            本日の施術
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRefresh}
            className="hover:bg-purple-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 本日の合計 */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-1">
                <FileText className="w-4 h-4" />
                <span>施術件数</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">{totalTreatments}件</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                <DollarSign className="w-4 h-4" />
                <span>合計金額</span>
              </div>
              <p className="text-3xl font-bold text-green-900">¥{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : todayTreatments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600">本日の施術記録はまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTreatments
              .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))
              .map((treatment) => (
                <div 
                  key={treatment.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-stone-500" />
                      <span className="font-semibold text-stone-800">{treatment.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {treatment.pressure_level && (
                        <Badge className={`${pressureLevelColors[treatment.pressure_level]} border text-xs`}>
                          {treatment.pressure_level}
                        </Badge>
                      )}
                      {treatment.is_nominated && (
                        <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 text-xs">
                          <Star className="w-3 h-3 mr-1 fill-amber-600 text-amber-600" />
                          指名
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-stone-700 font-medium">{treatment.service_menu}</div>
                    
                    <div className="flex items-center gap-4 text-xs text-stone-600 flex-wrap">
                      {treatment.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{treatment.duration}分</span>
                        </div>
                      )}
                      {treatment.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-semibold text-green-700">¥{treatment.price.toLocaleString()}</span>
                        </div>
                      )}
                      {treatment.staff_name && (
                        <div className="flex items-center gap-1">
                          <UserCog className="w-3 h-3" />
                          <span>{treatment.staff_name}</span>
                        </div>
                      )}
                    </div>

                    {treatment.chief_complaint && (
                      <p className="text-xs text-stone-600 mt-2 pt-2 border-t border-purple-100">
                        <span className="font-semibold">主訴:</span> {treatment.chief_complaint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link to={createPageUrl("Treatments")}>
            <Button variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50">
              すべてのカルテを見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}