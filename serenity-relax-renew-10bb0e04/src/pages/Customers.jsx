
import React, { useState, useEffect } from "react";
import { Customer, Treatment, Staff, CustomerConsent } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Phone, Calendar, User, Edit, Trash2, ArrowLeft, AlertTriangle, Upload, Clock, UserCog, FileText, Star, Download, CheckCircle2, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CustomerForm from "../components/customers/CustomerForm";
import TreatmentForm from "../components/treatments/TreatmentForm";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerTreatments, setCustomerTreatments] = useState([]);
  const [customerConsent, setCustomerConsent] = useState(null); // 同意書情報
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    loadCustomers();
    loadStaff();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name_kana?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await Customer.list("-created_date");
      setCustomers(data);
      setFilteredCustomers(data);
      setError(null);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const staffData = await Staff.list();
      setStaff(staffData);
    } catch (err) {
      console.error("Error loading staff:", err);
      setStaff([]);
    }
  };

  const loadCustomerTreatments = async (customerId) => {
    try {
      const treatments = await Treatment.filter({ customer_id: customerId }, "-treatment_date");
      setCustomerTreatments(treatments);
    } catch (err) {
      console.error("Error loading treatments:", err);
      setCustomerTreatments([]);
    }
  };

  const loadCustomerConsent = async (customerId) => {
    try {
      const consents = await CustomerConsent.filter({ customer_id: customerId }, "-consent_date");
      if (consents.length > 0) {
        setCustomerConsent(consents[0]); // 最新の同意書を取得
      } else {
        setCustomerConsent(null);
      }
    } catch (err) {
      console.error("Error loading consent:", err);
      setCustomerConsent(null);
    }
  };

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setSelectedTreatment(null);
    setShowTreatmentForm(false);
    await loadCustomerTreatments(customer.id);
    await loadCustomerConsent(customer.id); // 同意書を読み込み
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleCustomerSubmit = async (customerData) => {
    try {
      if (editingCustomer) {
        await Customer.update(editingCustomer.id, customerData);
      } else {
        await Customer.create(customerData);
      }
      setShowForm(false);
      setEditingCustomer(null);
      await loadCustomers();
      if (selectedCustomer && editingCustomer && editingCustomer.id === customerData.id) {
          setSelectedCustomer(customerData);
      }
    } catch (err) {
      console.error("Error submitting customer:", err);
      alert(`顧客情報の保存中にエラーが発生しました: ${err.message}`);
    }
  };

  const handleTreatmentSubmit = async (treatmentData) => {
    try {
      const dataToSave = {
        ...treatmentData,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name
      };
      
      console.log("Saving treatment:", dataToSave);
      
      await Treatment.create(dataToSave);
      setShowTreatmentForm(false);
      if (selectedCustomer) {
        await loadCustomerTreatments(selectedCustomer.id);
      }
      alert("カルテを保存しました");
    } catch (err) {
      console.error("Error saving treatment:", err);
      alert(`カルテの保存中にエラーが発生しました: ${err.message}`);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
    setSelectedCustomer(null);
    setShowTreatmentForm(false);
    setCustomerConsent(null); // Clear consent info when editing customer
  };

  const handleDelete = async (customerId) => {
    if (confirm("この顧客を削除してもよろしいですか？")) {
      try {
        await Customer.delete(customerId);
        await loadCustomers();
        setSelectedCustomer(null);
        setCustomerTreatments([]);
        setCustomerConsent(null); // Clear consent info when customer is deleted
        setShowTreatmentForm(false);
      } catch (err) {
        console.error("Error deleting customer:", err);
        alert(`顧客の削除中にエラーが発生しました: ${err.message}`);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`本当に全ての顧客（${customers.length}件）を削除しますか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    if (!confirm("最終確認：全ての顧客データが完全に削除されます。本当によろしいですか？")) {
      return;
    }

    try {
      setIsLoading(true);
      for (const customer of customers) {
        await Customer.delete(customer.id);
      }
      alert("全ての顧客を削除しました");
      await loadCustomers();
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      console.log("CSVエクスポート開始:", customers.length, "件");
      
      if (customers.length === 0) {
        alert("エクスポートする顧客データがありません");
        return;
      }

      const headers = [
        "名前",
        "ふりがな",
        "電話番号",
        "メールアドレス",
        "生年月日",
        "性別",
        "住所",
        "初回来店日",
        "アレルギー情報",
        "医療的注意事項",
        "好みや要望",
        "登録日"
      ];

      const csvData = customers.map(customer => {
        return [
          customer.name || "",
          customer.name_kana || "",
          customer.phone || "",
          customer.email || "",
          customer.birth_date || "",
          customer.gender === "male" ? "男性" : customer.gender === "female" ? "女性" : customer.gender === "other" ? "その他" : "",
          customer.address || "",
          customer.first_visit_date || "",
          customer.allergies || "",
          customer.medical_notes || "",
          customer.preferences || "",
          customer.created_date ? formatDate(customer.created_date) : ""
        ];
      });

      console.log("CSVデータ作成完了:", csvData.length, "行");

      const csvRows = [headers.join(",")];
      
      csvData.forEach(row => {
        const escapedRow = row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes("\n") || cellStr.includes('"')) {
            return '"' + cellStr.replace(/"/g, '""') + '"';
          }
          return cellStr;
        });
        csvRows.push(escapedRow.join(","));
      });

      const csvContent = csvRows.join("\n");
      console.log("CSV生成完了:", csvContent.length, "文字");

      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      link.download = `顧客リスト_${dateStr}.csv`;
      
      console.log("ダウンロード開始:", link.download);
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("ダウンロード完了");
      }, 100);

      alert(`${customers.length}件の顧客データをエクスポートしました`);
    } catch (error) {
      console.error("CSVエクスポートエラー:", error);
      alert("CSVエクスポートに失敗しました: " + error.message);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-red-50">
          <h2 className="text-red-900 font-bold mb-2">エラーが発生しました</h2>
          <p className="text-red-700">{error}</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-500" />
          <p className="text-stone-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // カルテ詳細表示
  if (selectedTreatment) {
    const pressureLevelColors = {
      "弱め": "bg-blue-100 text-blue-800 border-blue-200",
      "普通": "bg-green-100 text-green-800 border-green-200",
      "強め": "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedTreatment(null)}
              className="border-stone-300 hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-stone-800">カルテ詳細</h2>
          </div>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-stone-100 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {selectedCustomer?.name?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-stone-800">{selectedCustomer?.name}</h3>
                      {selectedTreatment.pressure_level && (
                        <Badge className={`${pressureLevelColors[selectedTreatment.pressure_level]} border text-xs`}>
                          {selectedTreatment.pressure_level}
                        </Badge>
                      )}
                      {selectedTreatment.staff_name && (
                        <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-800">
                          <UserCog className="w-3 h-3 mr-1" />
                          {selectedTreatment.staff_name}
                        </Badge>
                      )}
                      {selectedTreatment.is_nominated && (
                        <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 text-xs">
                          <Star className="w-3 h-3 mr-1 fill-amber-600 text-amber-600" />
                          指名
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span>{formatDate(selectedTreatment.treatment_date)}</span>
                      </div>
                      {selectedTreatment.duration && (
                        <>
                          <span className="text-stone-300">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-stone-400" />
                            <span>{selectedTreatment.duration}分</span>
                          </div>
                        </>
                      )}
                      {selectedTreatment.price && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="font-semibold">¥{selectedTreatment.price.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {selectedTreatment.service_menu && (
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-800 mb-2">施術メニュー</h4>
                  <p className="text-stone-700">{selectedTreatment.service_menu}</p>
                </div>
              )}

              {selectedTreatment.chief_complaint && (
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-800 mb-2">主訴</h4>
                  <p className="text-stone-600">{selectedTreatment.chief_complaint}</p>
                </div>
              )}

              {selectedTreatment.conversation && (
                <div className="mb-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-2">会話</h4>
                  <p className="text-indigo-800 text-sm whitespace-pre-wrap">{selectedTreatment.conversation}</p>
                </div>
              )}

              {selectedTreatment.treatment_details && (
                <div className="mb-4">
                  <h4 className="font-semibold text-stone-800 mb-2">施術内容</h4>
                  <p className="text-stone-600 whitespace-pre-wrap">{selectedTreatment.treatment_details}</p>
                </div>
              )}

              {selectedTreatment.precautions && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-100">
                  <h4 className="font-semibold text-red-900 mb-2">注意事項</h4>
                  <p className="text-red-800 text-sm whitespace-pre-wrap">{selectedTreatment.precautions}</p>
                </div>
              )}

              {selectedTreatment.customer_feedback && (
                <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">お客様の反応</h4>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{selectedTreatment.customer_feedback}</p>
                </div>
              )}

              {selectedTreatment.next_recommendation && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2">次回の提案</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">{selectedTreatment.next_recommendation}</p>
                </div>
              )}

              {selectedTreatment.staff_notes && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2">スタッフメモ</h4>
                  <p className="text-amber-800 text-sm whitespace-pre-wrap">{selectedTreatment.staff_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 顧客詳細表示
  if (selectedCustomer) {
    const genderLabel = {
      male: "男性",
      female: "女性",
      other: "その他"
    };

    const selectedCustomerIconGradient = selectedCustomer.gender === 'male' 
      ? 'from-blue-400 to-cyan-300'
      : selectedCustomer.gender === 'female'
      ? 'from-pink-400 to-rose-300'
      : 'from-amber-400 to-orange-300';

    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerTreatments([]);
                setCustomerConsent(null); // 同意書情報をクリア
                setShowTreatmentForm(false);
              }}
              className="border-stone-300 hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-stone-800">
              {showTreatmentForm ? `カルテ新規作成 (${selectedCustomer?.name})` : "顧客詳細"}
            </h2>
          </div>

          {showTreatmentForm && (
            <div className="mb-6">
              <TreatmentForm
                customer={selectedCustomer}
                treatment={{
                  customer_id: selectedCustomer.id,
                  customer_name: selectedCustomer.name,
                  treatment_date: new Date().toISOString().split('T')[0],
                  pressure_level: "普通"
                }}
                staff={staff}
                onSubmit={handleTreatmentSubmit}
                onCancel={() => {
                  setShowTreatmentForm(false);
                }}
              />
            </div>
          )}

          {!showTreatmentForm && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* 顧客情報カード */}
              <Card className="lg:col-span-1 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <div className="p-6 border-b border-stone-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${selectedCustomerIconGradient} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                        {selectedCustomer.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-stone-800">{selectedCustomer.name}</h3>
                          {customerConsent && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <FileCheck className="w-3 h-3 mr-1" />
                              同意書済
                            </Badge>
                          )}
                        </div>
                        {selectedCustomer.name_kana && (
                          <p className="text-stone-500 mt-1">{selectedCustomer.name_kana}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(selectedCustomer)}
                        className="border-amber-300 hover:bg-amber-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(selectedCustomer.id)}
                        className="border-red-300 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* 基本情報 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-stone-800 text-lg mb-4">基本情報</h4>

                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-xs text-stone-500">電話番号</p>
                          <p className="font-medium">{selectedCustomer.phone}</p>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5" />
                        <div>
                          <p className="text-xs text-stone-500">メールアドレス</p>
                          <p className="font-medium">{selectedCustomer.email}</p>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.birth_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-xs text-stone-500">生年月日</p>
                          <p className="font-medium">{formatDate(selectedCustomer.birth_date)}</p>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.gender && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5" />
                        <div>
                          <p className="text-xs text-stone-500">性別</p>
                          <p className="font-medium">{genderLabel[selectedCustomer.gender]}</p>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-1" />
                        <div>
                          <p className="text-xs text-stone-500">住所</p>
                          <p className="font-medium">{selectedCustomer.address}</p>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.first_visit_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-xs text-stone-500">初回来店日</p>
                          <p className="font-medium">{formatDate(selectedCustomer.first_visit_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 同意書情報 */}
                  {customerConsent && (
                    <div className="space-y-4 mt-6 pt-6 border-t border-stone-200">
                      <h4 className="font-semibold text-stone-800 text-lg mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-green-600" />
                        同意書情報
                      </h4>

                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-semibold text-green-900">同意書取得済み</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-600">同意日:</span>
                            <span className="font-medium">{formatDate(customerConsent.consent_date)}</span>
                          </div>
                          {customerConsent.therapist_name && (
                            <div className="flex justify-between">
                              <span className="text-stone-600">担当セラピスト:</span>
                              <span className="font-medium">{customerConsent.therapist_name}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-stone-600">病歴・ケガ:</span>
                            <span className={`font-medium ${customerConsent.has_medical_history ? 'text-amber-700' : 'text-green-700'}`}>
                              {customerConsent.has_medical_history ? 'あり' : 'なし'}
                            </span>
                          </div>
                          {customerConsent.has_medical_history && customerConsent.medical_history_detail && (
                            <div className="pt-2 border-t border-green-200">
                              <p className="text-stone-600 text-xs mb-1">詳細:</p>
                              <p className="text-amber-800 whitespace-pre-wrap">{customerConsent.medical_history_detail}</p>
                            </div>
                          )}
                        </div>

                        {customerConsent.signature_data && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-xs text-stone-600 mb-2">署名:</p>
                            <div className="bg-white rounded border border-green-200 p-2">
                              <img 
                                src={customerConsent.signature_data} 
                                alt="署名" 
                                className="w-full h-auto max-h-24 object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 医療情報・要望 */}
                  <div className="space-y-4 mt-6">
                    <h4 className="font-semibold text-stone-800 text-lg mb-4">医療情報・要望</h4>

                    {selectedCustomer.allergies && (
                      <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm font-semibold text-red-900 mb-2">アレルギー情報</p>
                        <p className="text-sm text-red-800 whitespace-pre-wrap">{selectedCustomer.allergies}</p>
                      </div>
                    )}

                    {selectedCustomer.medical_notes && (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-sm font-semibold text-amber-900 mb-2">医療的注意事項</p>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{selectedCustomer.medical_notes}</p>
                      </div>
                    )}

                    {selectedCustomer.preferences && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-sm font-semibold text-blue-900 mb-2">好みや要望</p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedCustomer.preferences}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* カルテ履歴 */}
              <Card className="lg:col-span-2 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="border-b border-stone-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      カルテ履歴 ({customerTreatments.length}件)
                    </CardTitle>
                    <Button
                      onClick={() => {
                        setShowTreatmentForm(true);
                        setSelectedTreatment(null);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white shadow-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      カルテ作成
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {customerTreatments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-stone-400" />
                      </div>
                      <p className="text-stone-600">まだカルテがありません</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerTreatments.map((treatment) => (
                        <div
                          key={treatment.id}
                          onClick={() => setSelectedTreatment(treatment)}
                          className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-stone-800">{treatment.service_menu}</h4>
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
                              <div className="flex items-center gap-4 text-sm text-stone-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(treatment.treatment_date)}</span>
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
                          </div>
                          {treatment.chief_complaint && (
                            <p className="text-sm text-stone-600 line-clamp-2 mt-2">
                              <span className="font-semibold">主訴:</span> {treatment.chief_complaint}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">顧客管理</h1>
            <p className="text-stone-600 mt-1">顧客情報の登録・管理</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {customers.length > 0 && (
              <>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSVエクスポート
                </Button>
                <Button
                  onClick={handleDeleteAll}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  全削除
                </Button>
              </>
            )}
            <Link to={createPageUrl("ImportCustomers")}>
              <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                <Upload className="w-4 h-4 mr-2" />
                CSVインポート
              </Button>
            </Link>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setEditingCustomer(null);
                setSelectedCustomer(null);
                setCustomerTreatments([]);
                setCustomerConsent(null); // Clear consent info when opening customer form
                setShowTreatmentForm(false);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規顧客登録
            </Button>
          </div>
        </div>

        {showForm && (
          <CustomerForm
            customer={editingCustomer}
            onSubmit={handleCustomerSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
          />
        )}

        {!showForm && !selectedCustomer && (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="顧客名、ふりがな、電話番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-stone-200 focus:border-amber-300"
                />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem"
            }}>
              {filteredCustomers.map((customer) => {
                const iconGradient = customer.gender === 'male' 
                  ? 'from-blue-400 to-cyan-300'
                  : customer.gender === 'female'
                  ? 'from-pink-400 to-rose-300'
                  : 'from-amber-400 to-orange-300';

                return (
                  <Card
                    key={customer.id}
                    className="p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-amber-50/30 relative"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`bg-gradient-to-br ${iconGradient} rounded-full flex items-center justify-center text-white font-bold shadow-md relative`}
                        style={{ width: "48px", height: "48px", minWidth: "48px", flexShrink: 0 }}
                      >
                        {customer.name?.[0] || "?"}
                        {/* Overlay badge for consent status on customer list card */}
                        {/* Note: This would require loading consent for all customers in the list,
                            which might be inefficient. For now, only show in detail view as per outline.
                            If needed here, `loadCustomerConsent` for all customers in `loadCustomers`
                            would be required, or fetch it on demand. */}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base sm:text-lg text-stone-800" style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {customer.name}
                          </h3>
                        </div>
                        {customer.name_kana && (
                          <p className="text-xs sm:text-sm text-stone-500" style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {customer.name_kana}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                          <Phone className="w-4 h-4 text-stone-400" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {customer.phone}
                          </span>
                        </div>
                      )}
                      {customer.first_visit_date && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                          <Calendar className="w-4 h-4 text-stone-400" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            初回: {formatDate(customer.first_visit_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredCustomers.length === 0 && (
              <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-stone-400" />
                </div>
                <p className="text-stone-600 text-lg">顧客が見つかりません</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
