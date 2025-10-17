
import React, { useState, useEffect, useCallback } from "react";
import { CashTransaction, User, Staff } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Printer, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import CashTransactionForm from "../components/cashbook/CashTransactionForm";
import CashTransactionList from "../components/cashbook/CashTransactionList";

export default function CashBook() {
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaffInfo, setCurrentStaffInfo] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const allTransactions = await CashTransaction.list("-transaction_date");
    
    // 選択月のトランザクションをフィルター
    const monthTransactions = allTransactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      const transMonth = `${transDate.getFullYear()}-${String(transDate.getMonth() + 1).padStart(2, '0')}`;
      return transMonth === selectedMonth;
    });

    // 選択月より前のトランザクションから期首残高を計算
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    const previousTransactions = allTransactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate < monthStart;
    });

    const opening = previousTransactions.reduce((sum, t) => {
      return t.transaction_type === "入金" ? sum + t.amount : sum - t.amount;
    }, 0);

    setOpeningBalance(opening);
    setTransactions(monthTransactions);
    setIsLoading(false);
  }, [selectedMonth]); // loadData depends on selectedMonth

  const loadCurrentStaff = async () => {
    try {
      const user = await User.me();
      const staffList = await Staff.filter({ user_email: user.email });
      if (staffList.length > 0) {
        setCurrentStaffInfo(staffList[0]);
      }
    } catch (err) {
      console.error("Error loading current staff:", err);
    }
  };

  useEffect(() => {
    loadCurrentStaff();
    loadData();
  }, [loadData]); // loadData is now a stable reference or changes when selectedMonth changes

  const handleSubmit = async (transactionData) => {
    if (editingTransaction) {
      await CashTransaction.update(editingTransaction.id, transactionData);
    } else {
      await CashTransaction.create(transactionData);
    }
    setShowForm(false);
    setEditingTransaction(null);
    loadData();
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transactionId) => {
    if (confirm("この取引を削除してもよろしいですか？")) {
      await CashTransaction.delete(transactionId);
      loadData();
    }
  };

  const handlePrint = () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const monthDisplay = `${year}年${month}月`;

      const totalIncome = transactions
        .filter(t => t.transaction_type === "入金")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter(t => t.transaction_type === "出金")
        .reduce((sum, t) => sum + t.amount, 0);

      const closingBalance = openingBalance + totalIncome - totalExpense;

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
          <title>現金出納表 - ${monthDisplay}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 15mm; }
            }
            body {
              font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 1200px;
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
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .summary-box h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #666;
            }
            .summary-box .amount {
              font-size: 24px;
              font-weight: bold;
            }
            .income { color: #10b981; }
            .expense { color: #ef4444; }
            .balance { color: #3b82f6; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #4f46e5;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background: #f8f9fa;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .income-row {
              background: #f0fdf4 !important;
            }
            .expense-row {
              background: #fef2f2 !important;
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
            <h1>💰 現金出納表</h1>
            <div class="period">${monthDisplay}</div>
          </div>

          <div class="summary">
            <div class="summary-box">
              <h3>期首残高</h3>
              <div class="amount balance">¥${openingBalance.toLocaleString()}</div>
            </div>
            <div class="summary-box">
              <h3>入金合計</h3>
              <div class="amount income">¥${totalIncome.toLocaleString()}</div>
            </div>
            <div class="summary-box">
              <h3>出金合計</h3>
              <div class="amount expense">¥${totalExpense.toLocaleString()}</div>
            </div>
            <div class="summary-box">
              <h3>期末残高</h3>
              <div class="amount balance">¥${closingBalance.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>種別</th>
                <th>カテゴリ</th>
                <th>摘要</th>
                <th>支払方法</th>
                <th class="text-right">入金</th>
                <th class="text-right">出金</th>
                <th class="text-right">残高</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="7" class="text-right"><strong>期首残高</strong></td>
                <td class="text-right"><strong>¥${openingBalance.toLocaleString()}</strong></td>
              </tr>
              ${transactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)).map((t, index) => {
                let currentRunningBalance = openingBalance;
                for (let i = 0; i <= index; i++) {
                  currentRunningBalance += transactions[i].transaction_type === "入金" ? transactions[i].amount : -transactions[i].amount;
                }
                const rowClass = t.transaction_type === "入金" ? "income-row" : "expense-row";
                return `
                  <tr class="${rowClass}">
                    <td>${format(new Date(t.transaction_date), 'MM/dd(E)', { locale: ja })}</td>
                    <td>${t.transaction_type}</td>
                    <td>${t.category}</td>
                    <td>${t.description || '-'}</td>
                    <td>${t.payment_method}</td>
                    <td class="text-right">${t.transaction_type === "入金" ? `¥${t.amount.toLocaleString()}` : '-'}</td>
                    <td class="text-right">${t.transaction_type === "出金" ? `¥${t.amount.toLocaleString()}` : '-'}</td>
                    <td class="text-right">¥${currentRunningBalance.toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="background: #e0e7ff;">
                <td colspan="5" class="text-right"><strong>合計</strong></td>
                <td class="text-right"><strong>¥${totalIncome.toLocaleString()}</strong></td>
                <td class="text-right"><strong>¥${totalExpense.toLocaleString()}</strong></td>
                <td class="text-right"><strong>¥${closingBalance.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>ゆたか三田三輪店</p>
            <p>この出納表は${new Date().toLocaleString('ja-JP')}に発行されました</p>
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

  // 全スタッフが編集可能に変更
  const canEdit = currentStaffInfo !== null;

  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  const totalIncome = transactions
    .filter(t => t.transaction_type === "入金")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.transaction_type === "出金")
    .reduce((sum, t) => sum + t.amount, 0);

  const closingBalance = openingBalance + totalIncome - totalExpense;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">現金出納表</h1>
            <p className="text-stone-600 mt-1">入出金の記録と管理</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40 bg-white/80 border-stone-200">
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
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Printer className="w-5 h-5 mr-2" />
              印刷
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingTransaction(null);
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                取引を追加
              </Button>
            )}
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                期首残高
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">
                ¥{openingBalance.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                入金合計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">
                ¥{totalIncome.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                出金合計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-900">
                ¥{totalExpense.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-indigo-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                期末残高
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-indigo-900">
                ¥{closingBalance.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <AnimatePresence>
          {showForm && (
            <CashTransactionForm
              transaction={editingTransaction}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTransaction(null);
              }}
              currentStaffName={currentStaffInfo?.name}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <CashTransactionList
            transactions={transactions}
            isLoading={isLoading}
            onEdit={canEdit ? handleEdit : null}
            onDelete={canEdit ? handleDelete : null}
            openingBalance={openingBalance}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}
