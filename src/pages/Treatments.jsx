
import React, { useState, useEffect } from "react";
import { Treatment, Customer, Staff, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TreatmentForm from "../components/treatments/TreatmentForm";
import CustomerTreatmentGroup from "../components/treatments/CustomerTreatmentGroup";

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCurrentStaff();
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = treatments.filter(treatment =>
        treatment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.service_menu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTreatments(filtered);
    } else {
      setFilteredTreatments(treatments);
    }
  }, [searchTerm, treatments]);

  const loadCurrentStaff = async () => {
    try {
      const user = await User.me();
      const staffList = await Staff.filter({ user_email: user.email });
      if (staffList.length > 0) {
        setCurrentStaffInfo(staffList[0]);
      }
    } catch (err) {
      console.error("Error loading current staff:", err);
      setCurrentStaffInfo(null); 
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [treatmentData, customerData, staffData] = await Promise.all([
      Treatment.list("-treatment_date"),
      Customer.list(),
      Staff.list()
    ]);
    setTreatments(treatmentData);
    setFilteredTreatments(treatmentData);
    setCustomers(customerData);
    setStaff(staffData);
    setIsLoading(false);
  };

  const handleSubmit = async (treatmentData) => {
    if (editingTreatment && editingTreatment.id) { // Check for existing ID to differentiate update from create
      await Treatment.update(editingTreatment.id, treatmentData);
    } else {
      await Treatment.create(treatmentData);
    }
    setShowForm(false);
    setEditingTreatment(null);
    loadData();
  };

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment);
    setShowForm(true);
  };

  const handleDelete = async (treatmentId) => {
    if (!confirm("このカルテを削除してもよろしいですか？")) {
      return;
    }
    
    try {
      await Treatment.delete(treatmentId);
      await loadData();
      alert("カルテを削除しました");
    } catch (err) {
      console.error("カルテ削除エラー:", err);
      alert("カルテの削除に失敗しました");
    }
  };

  const handleCreateForCustomer = (customerId, customerName) => {
    // 特定の顧客のカルテを新規作成
    setEditingTreatment({
      customer_id: customerId,
      customer_name: customerName,
      treatment_date: new Date().toISOString().split('T')[0], // Default to current date
      pressure_level: "普通" // Default pressure level
      // Other fields can be left null or set to defaults
    });
    setShowForm(true);
  };

  const canEdit = currentStaffInfo && currentStaffInfo.role !== "閲覧のみ";

  // 顧客ごとにグループ化
  const groupedByCustomer = filteredTreatments.reduce((acc, treatment) => {
    const customerId = treatment.customer_id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer_name: treatment.customer_name,
        customer_id: customerId,
        treatments: []
      };
    }
    acc[customerId].treatments.push(treatment);
    return acc;
  }, {});

  const customerGroups = Object.values(groupedByCustomer).sort((a, b) => {
    // 最新の施術日で並び替え
    const aLatest = Math.max(...a.treatments.map(t => new Date(t.treatment_date).getTime()));
    const bLatest = Math.max(...b.treatments.map(t => new Date(t.treatment_date).getTime()));
    return bLatest - aLatest;
  });

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">カルテ記録</h1>
            <p className="text-stone-600 mt-1">施術内容と経過の記録</p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => {
                setShowForm(!showForm);
                setEditingTreatment(null);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規カルテ作成
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <TreatmentForm
              treatment={editingTreatment}
              customers={customers}
              staff={staff}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTreatment(null);
              }}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="顧客名、施術メニュー、スタッフ名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-stone-200 focus:border-purple-300"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-stone-600 mt-2">
                  {filteredTreatments.length}件のカルテが見つかりました
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white font-bold text-xl">...</span>
                </div>
                <p className="text-stone-600">読み込み中...</p>
              </div>
            ) : customerGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-stone-400" />
                </div>
                <p className="text-stone-600 text-lg">カルテが見つかりません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerGroups.map((group) => (
                  <CustomerTreatmentGroup
                    key={group.customer_id}
                    customerName={group.customer_name}
                    customerId={group.customer_id}
                    treatments={group.treatments}
                    onEdit={canEdit ? handleEdit : null}
                    onDelete={canEdit ? handleDelete : null}
                    onCreateNew={canEdit ? handleCreateForCustomer : null}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
