import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, Clock, Edit, Trash2, FileText, UserCog, Star } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

const pressureLevelColors = {
  "弱め": "bg-blue-100 text-blue-800 border-blue-200",
  "普通": "bg-green-100 text-green-800 border-green-200",
  "強め": "bg-red-100 text-red-800 border-red-200"
};

export default function TreatmentList({ treatments, isLoading, onEdit, onDelete, canEdit }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
        <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
          <FileText className="w-10 h-10 text-stone-400" />
        </div>
        <p className="text-stone-600 text-lg">カルテがありません</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {treatments.map((treatment, index) => (
        <motion.div
          key={treatment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-stone-100 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {treatment.customer_name?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-stone-800">{treatment.customer_name}</h3>
                      <Badge className={`${pressureLevelColors[treatment.pressure_level]} border text-xs`}>
                        {treatment.pressure_level}
                      </Badge>
                      {treatment.staff_name && (
                        <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-800">
                          <UserCog className="w-3 h-3 mr-1" />
                          {treatment.staff_name}
                        </Badge>
                      )}
                      {treatment.is_nominated && (
                        <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 text-xs">
                          <Star className="w-3 h-3 mr-1 fill-amber-600 text-amber-600" />
                          指名
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span>{format(new Date(treatment.treatment_date), "yyyy年MM月dd日", { locale: ja })}</span>
                      </div>
                      {treatment.duration && (
                        <>
                          <span className="text-stone-300">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-stone-400" />
                            <span>{treatment.duration}分</span>
                          </div>
                        </>
                      )}
                      {treatment.price && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="font-semibold">¥{treatment.price.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(treatment)}
                      className="border-purple-300 hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(treatment.id)}
                      className="border-red-300 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-stone-800 mb-2">施術メニュー</h4>
                <p className="text-stone-700">{treatment.service_menu}</p>
              </div>

              {treatment.chief_complaint && (
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-800 mb-2">主訴</h4>
                  <p className="text-stone-600">{treatment.chief_complaint}</p>
                </div>
              )}

              {treatment.conversation && (
                <div className="mb-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-2">会話</h4>
                  <p className="text-indigo-800 text-sm">{treatment.conversation}</p>
                </div>
              )}

              {treatment.treatment_details && (
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-800 mb-2">施術内容</h4>
                  <p className="text-stone-600">{treatment.treatment_details}</p>
                </div>
              )}

              {treatment.precautions && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-100">
                  <h4 className="font-semibold text-red-900 mb-2">注意事項</h4>
                  <p className="text-red-800 text-sm">{treatment.precautions}</p>
                </div>
              )}

              {treatment.customer_feedback && (
                <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">お客様の反応</h4>
                  <p className="text-blue-800 text-sm">{treatment.customer_feedback}</p>
                </div>
              )}

              {treatment.next_recommendation && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2">次回の提案</h4>
                  <p className="text-green-800 text-sm">{treatment.next_recommendation}</p>
                </div>
              )}

              {treatment.staff_notes && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2">スタッフメモ</h4>
                  <p className="text-amber-800 text-sm">{treatment.staff_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}