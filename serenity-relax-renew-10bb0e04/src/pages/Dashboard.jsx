import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, TrendingUp, GripVertical } from "lucide-react";
import { format, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import StatsCard from "../components/dashboard/StatsCard";
import TodayAppointments from "../components/dashboard/TodayAppointments";
import RecentTreatments from "../components/dashboard/RecentTreatments";
import StaffPerformance from "../components/dashboard/StaffPerformance";
import TargetProgress from "../components/dashboard/TargetProgress";
import TodayTreatments from "../components/dashboard/TodayTreatments";
import RejectionCounter from "../components/dashboard/RejectionCounter";

const DEFAULT_LAYOUT = [
  { id: "target", type: "target" },
  { id: "rejection", type: "rejection" },
  { id: "today-summary", type: "today-summary" },
  { id: "stats", type: "stats" },
  { id: "staff", type: "staff" },
  { id: "appointments", type: "appointments" }
];

export default function Dashboard({ staffInfo }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTreatments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    newCustomersThisMonth: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [todayTreatments, setTodayTreatments] = useState([]);
  const [recentTreatments, setRecentTreatments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [monthlyTarget, setMonthlyTarget] = useState(null);
  const [todayRejections, setTodayRejections] = useState(null);
  const [monthlyRejections, setMonthlyRejections] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem("dashboard-layout");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [customers, treatmentData, appointments, staffData] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Treatment.list("-treatment_date"),
        base44.entities.Appointment.list("-appointment_date"),
        base44.entities.Staff.list()
      ]);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayAppts = appointments.filter(apt =>
        isToday(new Date(apt.appointment_date))
      );
      const todayTreatmentsFiltered = treatmentData.filter(t =>
        isToday(new Date(t.treatment_date))
      );

      const thisMonth = treatmentData.filter(t => {
        const treatmentDate = new Date(t.treatment_date);
        return treatmentDate.getMonth() === today.getMonth() &&
               treatmentDate.getFullYear() === today.getFullYear();
      });
      const monthlyRevenue = thisMonth.reduce((sum, t) => sum + (t.price || 0), 0);

      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthTreatments = treatmentData.filter(t => {
        const treatmentDate = new Date(t.treatment_date);
        return treatmentDate.getMonth() === lastMonth.getMonth() &&
               treatmentDate.getFullYear() === lastMonth.getFullYear();
      });
      const lastMonthRevenue = lastMonthTreatments.reduce((sum, t) => sum + (t.price || 0), 0);

      const newCustomersThisMonth = customers.filter(c => {
        if (!c.created_date) return false;
        const createdDate = new Date(c.created_date);
        return createdDate.getMonth() === today.getMonth() &&
               createdDate.getFullYear() === today.getFullYear();
      }).length;

      setStats({
        totalCustomers: customers.length,
        totalTreatments: treatmentData.length,
        todayAppointments: todayAppts.length,
        monthlyRevenue,
        lastMonthRevenue,
        newCustomersThisMonth
      });

      setTodayAppointments(todayAppts.slice(0, 5));
      setTodayTreatments(todayTreatmentsFiltered.slice(0, 5));
      setRecentTreatments(treatmentData.slice(0, 5));
      setStaff(staffData);
      setTreatments(treatmentData);

      // 月次目標を取得
      const currentMonth = format(today, 'yyyy-MM');
      const targets = await base44.entities.MonthlyTarget.filter({ target_month: currentMonth });
      if (targets.length > 0) {
        setMonthlyTarget(targets[0]);
      }

      // 本日のお断り数を取得
      const rejections = await base44.entities.DailyRejection.filter({ rejection_date: todayStr });
      if (rejections.length > 0) {
        setTodayRejections(rejections[0]);
      } else {
        setTodayRejections(null);
      }

      // 今月のお断り数合計を計算
      const monthlyRejectionData = await base44.entities.DailyRejection.list();
      const thisMonthRejections = monthlyRejectionData.filter(r => {
        const rejectionDate = new Date(r.rejection_date);
        return rejectionDate.getMonth() === today.getMonth() &&
               rejectionDate.getFullYear() === today.getFullYear();
      });
      const totalMonthlyRejections = thisMonthRejections.reduce((sum, r) => sum + (r.rejection_count || 0), 0);
      setMonthlyRejections(totalMonthlyRejections);

    } catch (error) {
      console.error("データ読み込みエラー:", error);
    }
    setIsLoading(false);
  };

  const handleUpdateRejections = async (data) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const rejectionData = {
        rejection_date: todayStr,
        ...data
      };

      if (todayRejections) {
        await base44.entities.DailyRejection.update(todayRejections.id, rejectionData);
      } else {
        await base44.entities.DailyRejection.create(rejectionData);
      }
      
      await loadData();
    } catch (error) {
      console.error("お断り数更新エラー:", error);
      alert("お断り数の更新に失敗しました");
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(layout);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLayout(items);
    localStorage.setItem("dashboard-layout", JSON.stringify(items));
  };

  const renderSection = (section) => {
    switch (section.type) {
      case "target":
        return (
          <TargetProgress
            monthlyTarget={monthlyTarget}
            currentRevenue={stats.monthlyRevenue}
            lastMonthRevenue={stats.lastMonthRevenue}
            isLoading={isLoading}
            onRefresh={loadData}
            treatments={treatments}
          />
        );

      case "rejection":
        return (
          <RejectionCounter
            todayRejections={todayRejections}
            monthlyRejections={monthlyRejections}
            isLoading={isLoading}
            onUpdate={handleUpdateRejections}
          />
        );

      case "today-summary":
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <TodayAppointments
              appointments={todayAppointments}
              isLoading={isLoading}
              onRefresh={loadData}
            />
            <TodayTreatments
              treatments={todayTreatments}
              isLoading={isLoading}
              onRefresh={loadData}
            />
          </div>
        );

      case "stats":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="総顧客数"
              value={stats.totalCustomers}
              icon={Users}
              gradient="from-blue-400 to-cyan-300"
              isLoading={isLoading}
              subtitle={stats.newCustomersThisMonth > 0 ? `今月+${stats.newCustomersThisMonth}名` : null}
            />
            <StatsCard
              title="総施術件数"
              value={stats.totalTreatments}
              icon={FileText}
              gradient="from-purple-400 to-pink-300"
              isLoading={isLoading}
            />
            <StatsCard
              title="本日の予約"
              value={stats.todayAppointments}
              icon={Calendar}
              gradient="from-amber-400 to-orange-300"
              isLoading={isLoading}
            />
            <StatsCard
              title="今月の売上"
              value={`¥${stats.monthlyRevenue.toLocaleString()}`}
              icon={TrendingUp}
              gradient="from-green-400 to-emerald-300"
              isLoading={isLoading}
            />
          </div>
        );

      case "appointments":
        return (
          <RecentTreatments
            treatments={recentTreatments}
            isLoading={isLoading}
          />
        );

      case "staff":
        return (
          <StaffPerformance
            staff={staff}
            treatments={treatments}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">
            ダッシュボード
          </h1>
          <p className="text-stone-600">
            {format(new Date(), "yyyy年MM月dd日 (E)", { locale: ja })}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            💡 セクションをドラッグして並び替えできます
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8"
              >
                {layout.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative ${snapshot.isDragging ? 'z-50' : ''}`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-move opacity-0 hover:opacity-100 transition-opacity duration-200 hidden md:block"
                        >
                          <div className="bg-stone-200 rounded-lg p-2 shadow-lg">
                            <GripVertical className="w-5 h-5 text-stone-600" />
                          </div>
                        </div>
                        <div className={`${snapshot.isDragging ? 'shadow-2xl scale-105' : ''} transition-all duration-200`}>
                          {renderSection(section)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}