import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, gradient, isLoading, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-stone-600">
              {title}
            </CardTitle>
            <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
              <Icon className="w-5 h-5 text-stone-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <div className="text-3xl font-bold text-stone-800">
                {value}
              </div>
              {subtitle && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}