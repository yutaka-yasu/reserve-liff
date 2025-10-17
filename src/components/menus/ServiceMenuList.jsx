import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, DollarSign, Edit, Trash2, Tag, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

const categoryColors = {
  "マッサージ": "bg-purple-100 text-purple-800 border-purple-200",
  "アロマ": "bg-pink-100 text-pink-800 border-pink-200",
  "フェイシャル": "bg-blue-100 text-blue-800 border-blue-200",
  "ボディケア": "bg-green-100 text-green-800 border-green-200",
  "その他": "bg-gray-100 text-gray-800 border-gray-200"
};

export default function ServiceMenuList({ menus, isLoading, onEdit, onDelete, onToggleActive }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  if (menus.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-lg bg-white/80">
        <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
          <FileText className="w-10 h-10 text-stone-400" />
        </div>
        <p className="text-stone-600 text-lg">メニューがありません</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {menus.map((menu, index) => (
        <motion.div
          key={menu.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`
            border-0 shadow-lg backdrop-blur-sm transition-all duration-300
            ${menu.is_active 
              ? 'bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl' 
              : 'bg-gray-100 opacity-60'
            }
          `}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-stone-800 mb-2">{menu.menu_name}</h3>
                  {menu.category && (
                    <Badge className={`${categoryColors[menu.category]} border text-xs mb-2`}>
                      <Tag className="w-3 h-3 mr-1" />
                      {menu.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(menu)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => onDelete(menu.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span>{menu.duration}分</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-lg text-stone-800">
                    <span>¥{menu.price?.toLocaleString()}</span>
                  </div>
                </div>

                {menu.description && (
                  <p className="text-sm text-stone-600 line-clamp-3">
                    {menu.description}
                  </p>
                )}

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    {menu.is_active ? "有効" : "無効"}
                  </span>
                  <Switch
                    checked={menu.is_active}
                    onCheckedChange={() => onToggleActive(menu)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}