
import React, { useState, useEffect } from "react";
import { Treatment, Appointment } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, AlertCircle, Heart, FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function CustomerDetails({ customer, onBack, onEdit, onDelete }) {
  const [treatments, setTreatments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true);
      const [treatmentData, appointmentData] = await Promise.all([
        Treatment.filter({ customer_id: customer.id }, "-treatment_date"),
        Appointment.filter({ customer_id: customer.id }, "-appointment_date")
      ]);
      setTreatments(treatmentData);
      setAppointments(appointmentData);
      setIsLoading(false);
    };
    
    loadCustomerData();
  }, [customer.id]);

  const genderLabel = {
    male: "男性",
    female: "女性",
    other: "その他"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="border-stone-300 hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-stone-800">顧客詳細</h2>
      </div>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-300 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {customer.name?.[0] || "?"}
              </div>
              <div>
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                {customer.name_kana && (
                  <p className="text-stone-500 mt-1">{customer.name_kana}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(customer)}
                className="border-amber-300 hover:bg-amber-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(customer.id)}
                className="border-red-300 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-800 text-lg mb-4">基本情報</h3>
              
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">電話番号</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">メールアドレス</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">生年月日</p>
                    <p className="font-medium">
                      {format(new Date(customer.birth_date), "yyyy年MM月dd日", { locale: ja })}
                    </p>
                  </div>
                </div>
              )}

              {customer.gender && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-stone-500">性別</p>
                    <p className="font-medium">{genderLabel[customer.gender]}</p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-stone-400 mt-1" />
                  <div>
                    <p className="text-xs text-stone-500">住所</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}

              {customer.first_visit_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">初回来店日</p>
                    <p className="font-medium">
                      {format(new Date(customer.first_visit_date), "yyyy年MM月dd日", { locale: ja })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-stone-800 text-lg mb-4">医療情報</h3>

              {customer.allergies && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm font-semibold text-red-900">アレルギー情報</p>
                  </div>
                  <p className="text-sm text-red-800 ml-7">{customer.allergies}</p>
                </div>
              )}

              {customer.medical_notes && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-sm font-semibold text-amber-900">医療的注意事項</p>
                  </div>
                  <p className="text-sm text-amber-800 ml-7">{customer.medical_notes}</p>
                </div>
              )}

              {customer.preferences && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-2 mb-2">
                    <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm font-semibold text-blue-900">好みや要望</p>
                  </div>
                  <p className="text-sm text-blue-800 ml-7">{customer.preferences}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              施術履歴
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {treatments.length === 0 ? (
              <p className="text-center text-stone-500 py-8">施術履歴がありません</p>
            ) : (
              <div className="space-y-3">
                {treatments.slice(0, 5).map((treatment) => (
                  <div 
                    key={treatment.id}
                    className="p-3 rounded-lg bg-gradient-to-r from-stone-50 to-purple-50/30 border border-stone-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-stone-800">{treatment.service_menu}</span>
                      <span className="text-xs text-stone-500">
                        {format(new Date(treatment.treatment_date), "MM/dd", { locale: ja })}
                      </span>
                    </div>
                    {treatment.symptoms && (
                      <p className="text-sm text-stone-600 line-clamp-2">{treatment.symptoms}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              予約履歴
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {appointments.length === 0 ? (
              <p className="text-center text-stone-500 py-8">予約履歴がありません</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-3 rounded-lg bg-gradient-to-r from-stone-50 to-green-50/30 border border-stone-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-stone-800">{apt.service_menu}</span>
                      <Badge variant="outline" className="text-xs">
                        {apt.status === "confirmed" && "確認済み"}
                        {apt.status === "completed" && "完了"}
                        {apt.status === "cancelled" && "キャンセル"}
                        {apt.status === "no_show" && "来店なし"}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-600">
                      {format(new Date(apt.appointment_date), "yyyy/MM/dd", { locale: ja })} {apt.appointment_time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
