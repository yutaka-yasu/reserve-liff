
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, Clock, DollarSign, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StaffPerformance({ staff, treatments, isLoading }) {
  const calculateStaffStats = (staffId) => {
    const staffTreatments = treatments.filter(t => t.staff_id === staffId);
    const totalMinutes = staffTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalRevenue = staffTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
    const nominationCount = staffTreatments.filter(t => t.is_nominated).length;
    const treatmentCount = staffTreatments.length;
    const nominationRate = treatmentCount > 0 ? ((nominationCount / treatmentCount) * 100).toFixed(1) : 0;
    
    return {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
      totalRevenue,
      treatmentCount,
      nominationCount,
      nominationRate
    };
  };

  const activeStaff = staff.filter(s => s.is_active);
  
  const staffWithStats = activeStaff
    .map(member => ({
      ...member,
      stats: calculateStaffStats(member.id)
    }))
    .filter(member => member.stats.treatmentCount > 0)
    .sort((a, b) => b.stats.totalMinutes - a.stats.totalMinutes)
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          スタッフパフォーマンス
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : staffWithStats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <UserCog className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600">施術データがありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staffWithStats.map((member, index) => (
              <div 
                key={member.id}
                className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {member.name?.[0] || "?"}
                    </div>
                    {index < 3 && (
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-400 text-orange-900'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-stone-800">{member.name}</h4>
                      {member.position && (
                        <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-800">
                          {member.position}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-1 text-stone-500 mb-1">
                          <UserCog className="w-3 h-3" />
                          <span className="text-xs">施術人数</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                          {member.stats.treatmentCount}
                        </div>
                        <div className="text-xs text-stone-500">回</div>
                      </div>
                      
                      <div className="bg-white/70 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-1 text-stone-500 mb-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span className="text-xs">指名数</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-900">
                          {member.stats.nominationCount}
                        </div>
                        <div className="text-xs text-amber-700">
                          {member.stats.nominationRate}%
                        </div>
                      </div>
                      
                      <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center gap-1 text-stone-500 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">累計時間</span>
                        </div>
                        <div className="text-xl font-bold text-indigo-900">
                          {member.stats.totalHours}h
                        </div>
                        <div className="text-xs text-stone-500">
                          {member.stats.remainingMinutes > 0 && `${member.stats.remainingMinutes}m`}
                        </div>
                      </div>
                      
                      <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-1 text-stone-500 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-xs">売上</span>
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {Math.round(member.stats.totalRevenue / 10000)}万円
                        </div>
                        <div className="text-xs text-stone-500">
                          {member.stats.totalRevenue.toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
