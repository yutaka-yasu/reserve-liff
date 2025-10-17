import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

const typeColors = {
  "入金": "bg-green-100 text-green-800 border-green-200",
  "出金": "bg-red-100 text-red-800 border-red-200"
};

const categoryColors = {
  "施術料金": "bg-purple-100 text-purple-800",
  "商品売上": "bg-blue-100 text-blue-800",
  "その他収入": "bg-cyan-100 text-cyan-800",
  "仕入れ": "bg-orange-100 text-orange-800",
  "光熱費": "bg-yellow-100 text-yellow-800",
  "人件費": "bg-pink-100 text-pink-800",
  "消耗品": "bg-gray-100 text-gray-800",
  "その他経費": "bg-stone-100 text-stone-800"
};

export default function CashTransactionList({ transactions, isLoading, onEdit, onDelete, openingBalance, canEdit }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 日付順にソート
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.transaction_date) - new Date(b.transaction_date)
  );

  // 累積残高を計算
  let runningBalance = openingBalance;

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-stone-800">取引一覧</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600">取引がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 期首残高 */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900">期首残高</span>
                <span className="text-xl font-bold text-blue-900">
                  ¥{openingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {sortedTransactions.map((transaction, index) => {
              runningBalance += transaction.transaction_type === "入金" 
                ? transaction.amount 
                : -transaction.amount;

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`
                    p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md
                    ${transaction.transaction_type === "入金" 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }
                  `}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col gap-2">
                          <Badge className={`${typeColors[transaction.transaction_type]} border text-sm font-bold`}>
                            {transaction.transaction_type}
                          </Badge>
                          <Badge variant="outline" className={`${categoryColors[transaction.category]} text-xs`}>
                            {transaction.category}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-stone-600">
                              {format(new Date(transaction.transaction_date), "MM月dd日(E)", { locale: ja })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method}
                            </Badge>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-stone-700 mb-1">{transaction.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-stone-500">
                            {transaction.customer_name && (
                              <span>顧客: {transaction.customer_name}</span>
                            )}
                            {transaction.staff_name && (
                              <span>担当: {transaction.staff_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-2">
                        <div>
                          <div className={`text-2xl font-bold ${
                            transaction.transaction_type === "入金" ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {transaction.transaction_type === "入金" ? '+' : '-'}
                            ¥{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-stone-600 mt-1">
                            残高: ¥{runningBalance.toLocaleString()}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(transaction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => onDelete(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}