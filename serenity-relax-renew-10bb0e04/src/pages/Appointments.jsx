
import React, { useState, useEffect } from "react";
import { Appointment, Customer, Staff, User, Treatment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { SendEmail } from "@/api/integrations";

import AppointmentForm from "../components/appointments/AppointmentForm";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);

  useEffect(() => {
    loadCurrentStaff();
    loadData();
  }, []);

  const loadCurrentStaff = async () => {
    try {
      const user = await User.me();
      // Assuming 'user_email' is the field to link User to Staff
      // This will ensure the current logged-in user's staff role is retrieved
      const staffList = await Staff.filter({ user_email: user.email });
      if (staffList.length > 0) {
        setCurrentStaffInfo(staffList[0]);
      } else {
        // If no staff record found for the user, set a default non-editing role or null
        setCurrentStaffInfo(null);
      }
    } catch (err) {
      console.error("Error loading current staff:", err);
      setCurrentStaffInfo(null); // Ensure currentStaffInfo is null on error
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [appointmentData, customerData, treatmentData] = await Promise.all([
      Appointment.list("-appointment_date"),
      Customer.list(),
      Treatment.list("-treatment_date")
    ]);
    setAppointments(appointmentData);
    setCustomers(customerData);
    setTreatments(treatmentData);
    setIsLoading(false);
  };

  const handleSubmit = async (appointmentData) => {
    try {
      let appointmentId;
      if (editingAppointment) {
        await Appointment.update(editingAppointment.id, appointmentData);
        appointmentId = editingAppointment.id;
      } else {
        const newAppointment = await Appointment.create(appointmentData);
        appointmentId = newAppointment.id;
        
        // 予約確認メールを送信
        try {
          const emailBody = `
【予約確認】

お客様名: ${appointmentData.customer_name}
予約日: ${appointmentData.appointment_date}
予約時間: ${appointmentData.appointment_time}
施術メニュー: ${appointmentData.service_menu}
所要時間: ${appointmentData.duration}分

備考: ${appointmentData.notes || "なし"}

※このメールからGoogleカレンダーに追加できます
          `;
          
          await SendEmail({
            to: "yutakasantiansanlundian@gmail.com", // This might need to be dynamically determined based on customer's email
            subject: `【予約】${appointmentData.customer_name}様 - ${appointmentData.appointment_date} ${appointmentData.appointment_time}`,
            body: emailBody,
            from_name: "ゆたか三田三輪店"
          });
        } catch (emailError) {
          console.error("メール送信エラー:", emailError);
          // メール送信エラーでも予約は保存される
        }
      }
      
      setShowForm(false);
      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error("予約保存エラー:", error);
      alert("予約の保存中にエラーが発生しました");
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = async (appointmentId) => {
    if (confirm("この予約を削除してもよろしいですか？")) {
      await Appointment.delete(appointmentId);
      loadData();
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      await Appointment.update(appointmentId, { ...appointment, status: newStatus });
      
      // ステータスが「完了」に変更された場合、施術記録を自動作成
      if (newStatus === "completed" && appointment.status !== "completed") {
        try {
          // 既に同じ予約から作成された施術記録があるかチェック
          const existingTreatments = await Treatment.filter({
            customer_id: appointment.customer_id,
            treatment_date: appointment.appointment_date,
            // サービスメニューも一致するかで判断を厳密化
            service_menu: appointment.service_menu
          });
          
          // 同じ内容の施術記録がなければ作成
          if (existingTreatments.length === 0) {
            await Treatment.create({
              customer_id: appointment.customer_id,
              customer_name: appointment.customer_name,
              treatment_date: appointment.appointment_date,
              service_menu: appointment.service_menu,
              duration: appointment.duration,
              pressure_level: "普通", // デフォルト値
              staff_notes: `予約から自動作成（予約時刻: ${appointment.appointment_time}）`
            });
            
            alert("施術記録を自動作成しました。詳細は「カルテ記録」から編集できます。");
          }
        } catch (err) {
          console.error("施術記録の自動作成エラー:", err);
          // エラーが発生してもステータス変更は完了させる
        }
      }
      
      loadData();
    }
  };

  const canEdit = currentStaffInfo && currentStaffInfo.role !== "閲覧のみ";

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">予約管理</h1>
            <p className="text-stone-600 mt-1">予約の登録と管理</p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => {
                setShowForm(!showForm);
                setEditingAppointment(null);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規予約登録
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <AppointmentForm
              appointment={editingAppointment}
              customers={customers}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingAppointment(null);
              }}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <AppointmentCalendar
            appointments={appointments}
            treatments={treatments}
            isLoading={isLoading}
            onEdit={canEdit ? handleEdit : null}
            onDelete={canEdit ? handleDelete : null}
            onStatusChange={canEdit ? handleStatusChange : null}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}
