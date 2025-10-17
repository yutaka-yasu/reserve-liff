
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCog,
  Star
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

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

const pressureLevelColors = {
  "弱め": "bg-blue-100 text-blue-800 border-blue-200",
  "普通": "bg-green-100 text-green-800 border-green-200",
  "強め": "bg-red-100 text-red-800 border-red-200"
};

export default function AppointmentCalendar({ appointments, treatments, isLoading, onEdit, onDelete, onStatusChange, canEdit }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // カレンダーの日付配列を作成（週の最初の空白を含む）
  const getCalendarDays = () => {
    const firstDayOfWeek = getDay(monthStart); // 0=日曜, 1=月曜, ...
    const blanks = Array(firstDayOfWeek).fill(null);
    return [...blanks, ...daysInMonth];
  };

  const calendarDays = getCalendarDays();

  const getDayAppointments = (date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), date)
    );
  };

  const getDayTreatments = (date) => {
    return treatments.filter(treatment => 
      isSameDay(new Date(treatment.treatment_date), date)
    );
  };

  // 選択された日付が過去かどうか（今日を含まない）
  const isPastDate = (date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  // 選択された日付が今日かどうか
  const isTodayDate = isToday(selectedDate);

  // 選択された日付に応じて予約または施術記録を表示
  // 今日の場合は両方表示
  const selectedDateAppointments = getDayAppointments(selectedDate);
  const selectedDateTreatments = getDayTreatments(selectedDate);
  
  const isShowingBoth = isTodayDate;
  const isShowingTreatments = isPastDate(selectedDate); // Only true for strictly past dates
  const isShowingAppointments = !isPastDate(selectedDate); // True for today and future dates

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80">
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-stone-800">
              {format(currentMonth, "yyyy年MM月", { locale: ja })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="border-stone-300 hover:bg-stone-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="border-stone-300 hover:bg-stone-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
              <div key={i} className={`text-center text-sm font-semibold p-2 ${
                i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-stone-600'
              }`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                // 空白セル
                return <div key={`blank-${index}`} className="p-3" />;
              }

              const dayAppointments = getDayAppointments(day);
              const dayTreatments = getDayTreatments(day);
              const isPast = isPastDate(day);
              const hasAppointmentData = dayAppointments.length > 0;
              const hasTreatmentData = dayTreatments.length > 0;
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDateInCalendar = isToday(day);
              const dayOfWeek = getDay(day); // 0=日曜, 6=土曜

              return (
                <motion.button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${isSelected 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-50 border-amber-300 shadow-md' 
                      : isTodayDateInCalendar
                        ? 'bg-blue-50 border-blue-200'
                        : isPast
                          ? 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      isSelected 
                        ? 'text-amber-900' 
                        : isTodayDateInCalendar 
                          ? 'text-blue-900' 
                          : dayOfWeek === 0
                            ? 'text-red-600'
                            : dayOfWeek === 6
                              ? 'text-blue-600'
                              : isPast
                                ? 'text-stone-500'
                                : 'text-stone-800'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {(hasAppointmentData || hasTreatmentData) && (
                      <div className="flex justify-center gap-1 mt-1">
                        {hasAppointmentData && dayAppointments.slice(0, 1).map((_, i) => (
                          <div key={`apt-${index}-${i}`} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        ))}
                        {hasTreatmentData && dayTreatments.slice(0, 1).map((_, i) => (
                          <div key={`trt-${index}-${i}`} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-purple-50 rounded-lg border border-stone-200">
            <div className="flex items-center gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>予約</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>完了した施術</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
            {isShowingBoth ? (
              <>
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                {format(selectedDate, "MM月dd日(E)", { locale: ja })}の予約・施術
              </>
            ) : isShowingTreatments ? (
              <>
                <FileText className="w-5 h-5 text-purple-600" />
                {format(selectedDate, "MM月dd日(E)", { locale: ja })}の施術記録
              </>
            ) : (
              <>
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                {format(selectedDate, "MM月dd日(E)", { locale: ja })}の予約
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* 今日の場合：予約と施術の両方を表示 */}
          {isShowingBoth ? (
            <>
              {/* 予約セクション */}
              {selectedDateAppointments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    予約（{selectedDateAppointments.length}件）
                  </h3>
                  <div className="space-y-3">
                    {selectedDateAppointments
                      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                      .map((apt) => (
                        <div 
                          key={apt.id}
                          className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-green-50/30 border border-stone-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-stone-500" />
                              <span className="font-semibold text-stone-800">{apt.customer_name}</span>
                            </div>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onEdit(apt)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => onDelete(apt.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-stone-600">
                              <Clock className="w-4 h-4" />
                              <span>{apt.appointment_time}</span>
                              {apt.duration && <span>({apt.duration}分)</span>}
                            </div>

                            <div className="text-stone-700">{apt.service_menu}</div>

                            {canEdit ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Badge className={`${statusColors[apt.status]} border cursor-pointer text-xs`}>
                                    {statusLabels[apt.status]}
                                  </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => onStatusChange(apt.id, "confirmed")}>
                                    確認済み
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(apt.id, "completed")}>
                                    完了（施術記録を自動作成）
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(apt.id, "cancelled")}>
                                    キャンセル
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(apt.id, "no_show")}>
                                    来店なし
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Badge className={`${statusColors[apt.status]} border text-xs`}>
                                {statusLabels[apt.status]}
                              </Badge>
                            )}

                            {apt.notes && (
                              <p className="text-xs text-stone-500 mt-2">{apt.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 施術セクション */}
              {selectedDateTreatments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    完了した施術（{selectedDateTreatments.length}件）
                  </h3>
                  <div className="space-y-3">
                    {selectedDateTreatments
                      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))
                      .map((treatment) => (
                        <div 
                          key={treatment.id}
                          className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-stone-500" />
                              <span className="font-semibold text-stone-800">{treatment.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
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

                          <div className="space-y-2 text-sm">
                            <div className="text-stone-700 font-medium">{treatment.service_menu}</div>
                            
                            <div className="flex items-center gap-4 text-xs text-stone-600">
                              {treatment.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{treatment.duration}分</span>
                                </div>
                              )}
                              {treatment.price && (
                                <span className="font-semibold">¥{treatment.price.toLocaleString()}</span>
                              )}
                              {treatment.staff_name && (
                                <div className="flex items-center gap-1">
                                  <UserCog className="w-3 h-3" />
                                  <span>{treatment.staff_name}</span>
                                </div>
                              )}
                            </div>

                            {treatment.chief_complaint && (
                              <p className="text-xs text-stone-600 mt-2">
                                <span className="font-semibold">主訴:</span> {treatment.chief_complaint}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedDateAppointments.length === 0 && selectedDateTreatments.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-600">予約・施術記録がありません</p>
                </div>
              )}
            </>
          ) : isShowingTreatments ? ( // Strictly past dates
            // 過去の施術記録を表示
            <>
              {selectedDateTreatments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-600">施術記録がありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTreatments
                    .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))
                    .map((treatment) => (
                      <div 
                        key={treatment.id}
                        className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-stone-500" />
                            <span className="font-semibold text-stone-800">{treatment.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
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

                        <div className="space-y-2 text-sm">
                          <div className="text-stone-700 font-medium">{treatment.service_menu}</div>
                          
                          <div className="flex items-center gap-4 text-xs text-stone-600">
                            {treatment.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{treatment.duration}分</span>
                              </div>
                            )}
                            {treatment.price && (
                              <span className="font-semibold">¥{treatment.price.toLocaleString()}</span>
                            )}
                            {treatment.staff_name && (
                              <div className="flex items-center gap-1">
                                <UserCog className="w-3 h-3" />
                                <span>{treatment.staff_name}</span>
                              </div>
                            )}
                          </div>

                          {treatment.chief_complaint && (
                            <p className="text-xs text-stone-600 mt-2">
                              <span className="font-semibold">主訴:</span> {treatment.chief_complaint}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : ( // Today (handled by isShowingBoth) or Future dates
            // 予約を表示
            <>
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-600">予約がありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateAppointments
                    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                    .map((apt) => (
                      <div 
                        key={apt.id}
                        className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-green-50/30 border border-stone-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-stone-500" />
                            <span className="font-semibold text-stone-800">{apt.customer_name}</span>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(apt)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                onClick={() => onDelete(apt.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-stone-600">
                            <Clock className="w-4 h-4" />
                            <span>{apt.appointment_time}</span>
                            {apt.duration && <span>({apt.duration}分)</span>}
                          </div>

                          <div className="text-stone-700">{apt.service_menu}</div>

                          {canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Badge className={`${statusColors[apt.status]} border cursor-pointer text-xs`}>
                                  {statusLabels[apt.status]}
                                </Badge>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onStatusChange(apt.id, "confirmed")}>
                                  確認済み
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(apt.id, "completed")}>
                                  完了（施術記録を自動作成）
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(apt.id, "cancelled")}>
                                  キャンセル
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(apt.id, "no_show")}>
                                  来店なし
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge className={`${statusColors[apt.status]} border text-xs`}>
                              {statusLabels[apt.status]}
                            </Badge>
                          )}

                          {apt.notes && (
                            <p className="text-xs text-stone-500 mt-2">{apt.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
