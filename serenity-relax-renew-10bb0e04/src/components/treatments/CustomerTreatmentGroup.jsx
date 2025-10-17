
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Calendar, Clock, Edit, Trash2, UserCog, Star, Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const pressureLevelColors = {
  "弱め": "bg-blue-100 text-blue-800 border-blue-200",
  "普通": "bg-green-100 text-green-800 border-green-200",
  "強め": "bg-red-100 text-red-800 border-red-200"
};

export default function CustomerTreatmentGroup({ customerName, customerId, treatments, onEdit, onDelete, onCreateNew, canEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 施術を日付順にソート（新しい順）
  const sortedTreatments = [...treatments].sort((a, b) => 
    new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime()
  );

  // 最新の施術日
  const latestTreatment = sortedTreatments[0];
  const latestDate = latestTreatment ? format(new Date(latestTreatment.treatment_date), "yyyy年MM月dd日", { locale: ja }) : "";

  // 総施術回数
  const totalVisits = treatments.length;

  // 総売上
  const totalRevenue = treatments.reduce((sum, t) => sum + (t.price || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardHeader 
          className="border-b border-stone-100 pb-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {customerName?.[0] || "?"}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-stone-800 mb-1">{customerName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    来店 {totalVisits}回
                  </Badge>
                  <span className="text-xs">最終来店: {latestDate}</span>
                  <span className="text-xs font-semibold">総額: ¥{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && onCreateNew && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateNew(customerId, customerName);
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新規作成
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-stone-600"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  {sortedTreatments.map((treatment, index) => (
                    <motion.div
                      key={treatment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                              第{totalVisits - index}回
                            </Badge>
                            {treatment.pressure_level && (
                              <Badge className={`${pressureLevelColors[treatment.pressure_level]} border text-xs`}>
                                {treatment.pressure_level}
                              </Badge>
                            )}
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
                          <h4 className="font-bold text-stone-800 mb-1">{treatment.service_menu}</h4>
                          <div className="flex items-center gap-4 text-sm text-stone-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(treatment.treatment_date), "yyyy年MM月dd日", { locale: ja })}</span>
                            </div>
                            {treatment.duration && (
                              <>
                                <span className="text-stone-300">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
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
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEdit) {
                                  onEdit(treatment);
                                }
                              }}
                              className="border-purple-300 hover:bg-purple-50 h-8 w-8"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) {
                                  onDelete(treatment.id);
                                }
                              }}
                              className="border-red-300 hover:bg-red-50 text-red-600 h-8 w-8"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {treatment.chief_complaint && (
                        <div className="mt-3 p-3 rounded-lg bg-white/50 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-900 mb-1">主訴</p>
                          <p className="text-sm text-purple-800">{treatment.chief_complaint}</p>
                        </div>
                      )}

                      {treatment.conversation && (
                        <div className="mt-2 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                          <p className="text-xs font-semibold text-indigo-900 mb-1">会話</p>
                          <p className="text-sm text-indigo-800">{treatment.conversation}</p>
                        </div>
                      )}

                      {treatment.staff_notes && (
                        <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                          <p className="text-xs font-semibold text-amber-900 mb-1">スタッフメモ</p>
                          <p className="text-sm text-amber-800">{treatment.staff_notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
