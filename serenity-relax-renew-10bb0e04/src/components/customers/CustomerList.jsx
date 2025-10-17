import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function CustomerList({ customers, isLoading, onSelectCustomer }) {
  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
        <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-stone-400" />
        </div>
        <p className="text-stone-600 text-lg">顧客が見つかりません</p>
      </Card>
    );
  }

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
      gap: "1rem",
      width: "100%"
    }}>
      {customers.map((customer) => (
        <div key={customer.id} style={{ width: "100%" }}>
          <Card
            className="p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-amber-50/30 backdrop-blur-sm"
            onClick={() => onSelectCustomer(customer)}
            style={{ width: "100%", height: "100%" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div 
                className="bg-gradient-to-br from-amber-400 to-orange-300 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  minWidth: "48px", 
                  minHeight: "48px",
                  flexShrink: 0 
                }}
              >
                {customer.name?.[0] || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="font-bold text-base sm:text-lg text-stone-800" style={{ 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap" 
                }}>
                  {customer.name}
                </h3>
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
              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                <Phone className="w-4 h-4 text-stone-400" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {customer.phone}
                </span>
              </div>
              {customer.first_visit_date && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                  <Calendar className="w-4 h-4 text-stone-400" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    初回: {format(new Date(customer.first_visit_date), "yyyy/MM/dd", { locale: ja })}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}