
import React, { useState, useEffect } from "react";
import { Staff, Treatment, User, Attendance, ServiceMenu } from "@/api/entities"; // Added ServiceMenu
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";

import StaffForm from "../components/staff/StaffForm";
import StaffList from "../components/staff/StaffList";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [attendances, setAttendances] = useState([]); // New state for attendance
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadCurrentStaff();
  }, []);

  useEffect(() => {
    if (currentStaffInfo && currentStaffInfo.role === "管理者") {
      loadData();
    }
  }, [currentStaffInfo]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = staff.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.name_kana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchTerm, staff]);

  const loadCurrentStaff = async () => {
    try {
      const user = await User.me();
      const staffList = await Staff.filter({ user_email: user.email });
      if (staffList.length > 0) {
        setCurrentStaffInfo(staffList[0]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading current staff:", err);
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [staffData, treatmentData, attendanceData] = await Promise.all([ // Added attendanceData
      Staff.list("-created_date"),
      Treatment.list(),
      Attendance.list() // Fetch attendance data
    ]);
    setStaff(staffData);
    setTreatments(treatmentData);
    setAttendances(attendanceData); // Set attendance data
    setFilteredStaff(staffData);
    setIsLoading(false);
  };

  // 店舗の月次統計を計算
  const calculateMonthlyStats = (month) => {
    const monthTreatments = treatments.filter(t => {
      const treatmentDate = new Date(t.treatment_date);
      const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
      return treatmentMonth === month;
    });

    const totalRevenue = monthTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
    const totalMinutes = monthTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);
    const commissionPool = Math.round(totalRevenue * 0.25); // 総売上の25% (マネージャー報酬)

    // マネージャーの総施術時間を計算
    const managerTreatments = monthTreatments.filter(t => {
      const staffMember = staff.find(s => s.id === t.staff_id);
      return staffMember && staffMember.position === "マネージャー";
    });
    const managerTotalMinutes = managerTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);

    // 一般スタッフの総報酬を計算（1分25円）
    const generalStaffTreatments = monthTreatments.filter(t => {
      const staffMember = staff.find(s => s.id === t.staff_id);
      return staffMember && staffMember.position !== "マネージャー";
    });
    const generalStaffTotalMinutes = generalStaffTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);
    const generalStaffCommission = generalStaffTotalMinutes * 25;

    // 店舗の取り分 = 総売上 - マネージャー報酬(25%) - 一般スタッフ報酬
    const storeShare = totalRevenue - commissionPool - generalStaffCommission;

    return {
      totalRevenue,
      totalMinutes,
      commissionPool, // マネージャー報酬
      generalStaffCommission, // 一般スタッフ報酬
      storeShare, // 店舗取り分
      treatmentCount: monthTreatments.length,
      managerTotalMinutes,
      generalStaffTotalMinutes
    };
  };

  const calculateStaffStats = (staffId, month = null) => {
    let staffTreatments = treatments.filter(t => t.staff_id === staffId);
    let staffAttendances = attendances.filter(a => a.staff_id === staffId && a.work_type === "出勤");
    
    // 月が指定されている場合、その月のデータのみフィルター
    if (month) {
      staffTreatments = staffTreatments.filter(t => {
        const treatmentDate = new Date(t.treatment_date);
        const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
        return treatmentMonth === month;
      });
      
      staffAttendances = staffAttendances.filter(a => {
        const attDate = new Date(a.attendance_date);
        const attMonth = `${attDate.getFullYear()}-${String(attDate.getMonth() + 1).padStart(2, '0')}`;
        return attMonth === month;
      });
    }
    
    const totalMinutes = staffTreatments.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalRevenue = staffTreatments.reduce((sum, t) => sum + (t.price || 0), 0);
    const treatmentCount = staffTreatments.length;
    
    // 指名数をカウント
    const nominationCount = staffTreatments.filter(t => t.is_nominated).length;
    const nominationRate = treatmentCount > 0 ? ((nominationCount / treatmentCount) * 100).toFixed(1) : 0;
    
    // 勤務日数
    const workDays = staffAttendances.length;
    
    // 勤務時間を計算
    let totalWorkMinutes = 0;
    staffAttendances.forEach(att => {
      if (att.start_time && att.end_time) {
        const [startHour, startMin] = att.start_time.split(':').map(Number);
        const [endHour, endMin] = att.end_time.split(':').map(Number);
        const workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (workMinutes > 0) {
          totalWorkMinutes += workMinutes;
        }
      }
    });
    
    // 待機時間 = 勤務時間 - 施術時間
    const waitingMinutes = Math.max(0, totalWorkMinutes - totalMinutes);
    
    // スタッフ情報を取得
    const staffMember = staff.find(s => s.id === staffId);
    
    // 月次統計を取得（月が指定されている場合のみ）
    let monthlyStats = null;
    if (month) {
      monthlyStats = calculateMonthlyStats(month);
    }
    
    let commission = 0;
    let timeRatio = 0;
    let calculationType = "";
    
    // 役職によって計算方法を分ける（月次計算のみ）
    if (month && staffMember && monthlyStats) {
      if (staffMember.position === "マネージャー") {
        // マネージャー：総売上の25%をマネージャー間で時間比率で分配
        if (monthlyStats.managerTotalMinutes > 0 && totalMinutes > 0) {
          timeRatio = (totalMinutes / monthlyStats.managerTotalMinutes * 100).toFixed(1);
          commission = Math.round(monthlyStats.commissionPool * (totalMinutes / monthlyStats.managerTotalMinutes));
        }
        calculationType = "歩合制";
      } else {
        // 一般スタッフ：1分25円
        commission = totalMinutes * 25;
        calculationType = "時間単価";
        if (monthlyStats.totalMinutes > 0) {
          timeRatio = (totalMinutes / monthlyStats.totalMinutes * 100).toFixed(1);
        }
      }
    }
    
    return {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
      totalRevenue,
      treatmentCount,
      nominationCount,
      nominationRate,
      commission,
      timeRatio,
      calculationType,
      workDays,
      workMinutes: totalWorkMinutes,
      workHours: Math.floor(totalWorkMinutes / 60),
      workRemainingMinutes: totalWorkMinutes % 60,
      waitingMinutes,
      waitingHours: Math.floor(waitingMinutes / 60),
      waitingRemainingMinutes: waitingMinutes % 60
    };
  };

  // 累計統計を計算する関数を追加
  const calculateTotalStats = (staffId) => {
    return calculateStaffStats(staffId, null);
  };

  const handleSubmit = async (staffData) => {
    if (editingStaff) {
      await Staff.update(editingStaff.id, staffData);
    } else {
      await Staff.create(staffData);
    }
    setShowForm(false);
    setEditingStaff(null);
    loadData();
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    if (confirm("このスタッフを削除してもよろしいですか？")) {
      await Staff.delete(staffId);
      loadData();
    }
  };

  const handleToggleActive = async (member) => {
    await Staff.update(member.id, { ...member, is_active: !member.is_active });
    loadData();
  };

  const handlePrintReceipt = async (member, stats) => {
    try {
      // 詳細な施術データを取得
      const staffTreatments = treatments.filter(t => {
        if (t.staff_id !== member.id) return false;
        const treatmentDate = new Date(t.treatment_date);
        const treatmentMonth = `${treatmentDate.getFullYear()}-${String(treatmentDate.getMonth() + 1).padStart(2, '0')}`;
        return treatmentMonth === selectedMonth;
      });

      // ServiceMenuデータを取得してメニュー名とカテゴリーのマッピングを作成
      const serviceMenus = await ServiceMenu.list();
      const menuCategoryMap = {};
      serviceMenus.forEach(menu => {
        menuCategoryMap[menu.menu_name] = menu.category || "";
      });

      // メニュー別に集計（カテゴリー付き）
      const menuStats = {};
      staffTreatments.forEach(t => {
        const menuName = t.service_menu || "未設定";
        
        // メニュー名からカテゴリーを取得（複数メニューの場合は最初のメニューのカテゴリー）
        let displayName = menuName;
        const menuNames = menuName.split(' + ');
        const firstMenuName = menuNames[0].trim();
        const category = menuCategoryMap[firstMenuName];
        
        // カテゴリーがある場合は「カテゴリー メニュー名」の形式に
        // ただし、複数メニューを組み合わせた場合は元のメニュー名を使用
        if (category && menuNames.length === 1) { 
          displayName = `${category}　${menuName}`;
        }
        
        if (!menuStats[displayName]) {
          menuStats[displayName] = {
            count: 0,
            totalMinutes: 0,
            totalRevenue: 0
          };
        }
        menuStats[displayName].count += 1;
        menuStats[displayName].totalMinutes += (t.duration || 0);
        menuStats[displayName].totalRevenue += (t.price || 0);
      });

      // メニュー別統計を配列に変換（施術時間が多い順）
      const menuStatsArray = Object.entries(menuStats)
        .map(([menuName, data]) => ({
          menuName,
          ...data
        }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      const monthlyStats = calculateMonthlyStats(selectedMonth);
      const [year, month] = selectedMonth.split('-');
      const monthDisplay = `${year}年${month}月`;

      // マネージャーかどうかで計算式を変える
      const isManager = member.position === "マネージャー";

      // 印刷用HTMLを生成
      const printWindow = window.open('', '_blank');
      
      // ポップアップブロッカーでブロックされた場合
      if (!printWindow) {
        alert('ポップアップブロックを解除してください。\nブラウザのアドレスバー右側のアイコンから、このサイトのポップアップを許可してください。');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>報酬明細 - ${member.name} - ${monthDisplay}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 20mm; }
            }
            body {
              font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #4f46e5;
              font-size: 28px;
            }
            .header .period {
              font-size: 18px;
              color: #666;
              margin-top: 10px;
            }
            .staff-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .staff-info h2 {
              margin: 0 0 15px 0;
              color: #4f46e5;
              font-size: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h3 {
              color: #4f46e5;
              border-left: 4px solid #4f46e5;
              padding-left: 12px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 2px solid #4f46e5;
            }
            th, td {
              padding: 14px 12px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            th {
              background: #4f46e5;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            td {
              font-size: 14px;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            tr:hover {
              background: #e0e7ff;
            }
            .total-row {
              background: #fef3c7 !important;
              font-weight: bold;
              border-top: 3px solid #f59e0b;
            }
            .total-row td {
              font-size: 15px;
              padding: 16px 12px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .total-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin-top: 20px;
            }
            .total-box h3 {
              margin: 0 0 15px 0;
              color: #92400e;
              border: none;
              padding: 0;
            }
            .total-row-calc {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .total-row-calc.grand-total {
              border-top: 2px solid #f59e0b;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 24px;
              font-weight: bold;
              color: #92400e;
            }
            .calculation {
              background: #ede9fe;
              border: 1px solid #a78bfa;
              border-radius: 8px;
              padding: 15px;
              margin-top: 15px;
            }
            .calculation p {
              margin: 5px 0;
              font-size: 14px;
              color: #5b21b6;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 報酬明細書</h1>
            <div class="period">${monthDisplay}</div>
          </div>

          <div class="staff-info">
            <h2>👤 スタッフ情報</h2>
            <div class="info-row">
              <span><strong>氏名</strong></span>
              <span>${member.name}</span>
            </div>
            ${member.position ? `
            <div class="info-row">
              <span><strong>役職</strong></span>
              <span>${member.position}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span><strong>役割</strong></span>
              <span>${member.role}</span>
            </div>
            <div class="info-row">
              <span><strong>報酬方式</strong></span>
              <span>${isManager ? '歩合制（総売上の25%をマネージャー間で時間比率で分配）' : '時間単価制（1分25円）'}</span>
            </div>
            <div class="info-row">
              <span><strong>発行日</strong></span>
              <span>${new Date().toLocaleDateString('ja-JP')}</span>
            </div>
          </div>

          ${isManager ? `
          <div class="section">
            <h3>📈 店舗全体の実績</h3>
            <div class="info-row">
              <span>総売上</span>
              <span><strong>¥${monthlyStats.totalRevenue.toLocaleString()}</strong></span>
            </div>
            <div class="info-row">
              <span>マネージャー報酬（25%）</span>
              <span><strong>¥${monthlyStats.commissionPool.toLocaleString()}</strong></span>
            </div>
            <div class="info-row">
              <span>マネージャー総施術時間</span>
              <span><strong>${Math.floor(monthlyStats.managerTotalMinutes / 60)}時間${monthlyStats.managerTotalMinutes % 60}分</strong></span>
            </div>
            <div class="info-row">
              <span>施術件数</span>
              <span><strong>${monthlyStats.treatmentCount}件</strong></span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h3>⏱️ あなたの実績</h3>
            <div class="info-row">
              <span>勤務日数</span>
              <span><strong>${stats.workDays}日</strong></span>
            </div>
            <div class="info-row">
              <span>総勤務時間</span>
              <span><strong>${stats.workHours}時間${stats.workRemainingMinutes}分（${stats.workMinutes}分）</strong></span>
            </div>
            <div class="info-row">
              <span>施術時間</span>
              <span><strong>${stats.totalHours}時間${stats.remainingMinutes}分（${stats.totalMinutes}分）</strong></span>
            </div>
            <div class="info-row">
              <span>待機時間</span>
              <span><strong>${stats.waitingHours}時間${stats.waitingRemainingMinutes}分（${stats.waitingMinutes}分）</strong></span>
            </div>
            <div class="info-row">
              <span>施術回数</span>
              <span><strong>${stats.treatmentCount}回</strong></span>
            </div>
            <div class="info-row">
              <span>指名回数</span>
              <span><strong>${stats.nominationCount}回（${stats.nominationRate}%）</strong></span>
            </div>
            <div class="info-row">
              <span>売上貢献</span>
              <span><strong>¥${stats.totalRevenue.toLocaleString()}</strong></span>
            </div>
            ${isManager && monthlyStats.managerTotalMinutes > 0 ? `
            <div class="info-row">
              <span>マネージャー内時間比率</span>
              <span><strong>${stats.timeRatio}%</strong></span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>📋 メニュー別施術集計</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%;">メニュー名</th>
                  <th class="text-center" style="width: 15%;">施術回数</th>
                  <th class="text-center" style="width: 25%;">合計時間</th>
                  <th class="text-right" style="width: 20%;">売上</th>
                </tr>
              </thead>
              <tbody>
                ${menuStatsArray.map(menu => `
                  <tr>
                    <td><strong>${menu.menuName}</strong></td>
                    <td class="text-center">${menu.count}回</td>
                    <td class="text-center">${Math.floor(menu.totalMinutes / 60)}時間${menu.totalMinutes % 60}分<br/><span style="color: #666; font-size: 12px;">(${menu.totalMinutes}分)</span></td>
                    <td class="text-right"><strong>¥${menu.totalRevenue.toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td><strong>合計</strong></td>
                  <td class="text-center"><strong>${stats.treatmentCount}回</strong></td>
                  <td class="text-center"><strong>${stats.totalHours}時間${stats.remainingMinutes}分<br/><span style="font-size: 12px;">(${stats.totalMinutes}分)</span></strong></td>
                  <td class="text-right"><strong>¥${stats.totalRevenue.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="total-box">
            <h3>💰 報酬計算</h3>
            <div class="calculation">
              <p><strong>計算式：</strong></p>
              ${isManager ? `
                <p>総売上（¥${monthlyStats.totalRevenue.toLocaleString()}）× 25%${monthlyStats.managerTotalMinutes > 0 ? ` × マネージャー内時間比率（${stats.timeRatio}%）` : ''}</p>
                <p>= ¥${monthlyStats.totalRevenue.toLocaleString()} × 25%${monthlyStats.managerTotalMinutes > 0 ? ` × ${stats.timeRatio}%` : ''} = <strong>¥${stats.commission.toLocaleString()}</strong></p>
              ` : `
                <p>施術時間（${stats.totalMinutes}分）× 単価（¥25/分）</p>
                <p>= ${stats.totalMinutes}分 × ¥25 = <strong>¥${stats.commission.toLocaleString()}</strong></p>
              `}
            </div>
            <div class="total-row-calc">
              <span>基本報酬</span>
              <span>¥${stats.commission.toLocaleString()}</span>
            </div>
            <div class="total-row-calc grand-total">
              <span>合計支給額</span>
              <span>¥${stats.commission.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>ゆたか三田三輪店</p>
            <p>この明細書は${new Date().toLocaleString('ja-JP')}に発行されました</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("印刷エラー:", error);
      alert("印刷に失敗しました: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentStaffInfo || currentStaffInfo.role !== "管理者") {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">アクセス権限がありません</h2>
          <p className="text-stone-600">この機能は管理者のみ利用できます。</p>
        </div>
      </div>
    );
  }

  const monthlyStats = calculateMonthlyStats(selectedMonth);
  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">スタッフ管理</h1>
            <p className="text-stone-600 mt-1">スタッフ情報の登録・管理</p>
          </div>
          <Button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingStaff(null);
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            新規スタッフ登録
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <StaffForm
              staff={editingStaff}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingStaff(null);
              }}
              currentStaffRole={currentStaffInfo?.role}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <>
            {/* 月次店舗統計サマリー */}
            <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="border-b border-green-100">
                <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  {monthDisplay} 店舗統計
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div>
                    <p className="text-sm text-stone-600 mb-1">総売上</p>
                    <p className="text-2xl font-bold text-green-900">
                      ¥{monthlyStats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600 mb-1">マネージャー報酬</p>
                    <p className="text-xl font-bold text-amber-900">
                      ¥{monthlyStats.commissionPool.toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-500">総売上の25%</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600 mb-1">スタッフ報酬</p>
                    <p className="text-xl font-bold text-blue-900">
                      ¥{monthlyStats.generalStaffCommission.toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-500">{monthlyStats.generalStaffTotalMinutes}分 × ¥25</p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className="text-sm text-stone-600 mb-1">💰 店舗取り分</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      ¥{monthlyStats.storeShare.toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      総売上 - マネージャー報酬 - スタッフ報酬
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white border border-green-200">
                    <p className="text-xs text-stone-600 mb-2"><strong>内訳</strong></p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">総施術時間</span>
                        <span className="font-semibold">
                          {Math.floor(monthlyStats.totalMinutes / 60)}時間
                          {monthlyStats.totalMinutes % 60 > 0 && `${monthlyStats.totalMinutes % 60}分`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">施術件数</span>
                        <span className="font-semibold">{monthlyStats.treatmentCount}件</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-900 mb-2"><strong>💡 報酬計算方式</strong></p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• マネージャー：総売上の25%をマネージャー間で施術時間比率で分配</li>
                      <li>• 一般スタッフ：施術1分あたり25円</li>
                      <li>• 店舗取り分：総売上からマネージャー報酬とスタッフ報酬を差し引いた額</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="スタッフ名、ふりがな、役職で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-stone-200 focus:border-indigo-300"
                />
              </div>
              
              <div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-white/80 border-stone-200">
                    <SelectValue placeholder="月を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const monthStr = date.toISOString().slice(0, 7);
                      const [year, month] = monthStr.split('-');
                      return (
                        <SelectItem key={monthStr} value={monthStr}>
                          {year}年{month}月
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <StaffList
              staff={filteredStaff}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              calculateStaffStats={(staffId) => calculateStaffStats(staffId, selectedMonth)}
              calculateTotalStats={calculateTotalStats}
              selectedMonth={selectedMonth}
              onPrintReceipt={handlePrintReceipt}
            />
          </>
        )}
      </div>
    </div>
  );
}
