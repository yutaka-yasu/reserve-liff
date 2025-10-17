import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function RecentTreatments({ treatments, isLoading }) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-stone-800">
          最近の施術記録
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-600">施術記録がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {treatments.map((treatment) => (
              <div 
                key={treatment.id}
                className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-purple-50/30 border border-stone-100 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-stone-500" />
                    <span className="font-semibold text-stone-800">
                      {treatment.customer_name}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">
                    {format(new Date(treatment.treatment_date), "M/d (E)", { locale: ja })}
                  </span>
                </div>
                <div className="text-sm text-stone-600">
                  <div className="mb-1">{treatment.service_menu}</div>
                  {treatment.price && (
                    <div className="text-xs text-stone-500">
                      ¥{treatment.price.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link to={createPageUrl("Treatments")}>
            <Button variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50">
              すべてのカルテを見る
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}