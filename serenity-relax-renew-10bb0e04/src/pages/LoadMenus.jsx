import React, { useState } from "react";
import { ServiceMenu } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function LoadMenusPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [menus, setMenus] = useState([]);

  const loadMenusFromWebsite = async () => {
    setIsLoading(true);
    setStatus("loading");

    try {
      const response = await InvokeLLM({
        prompt: `以下のウェブサイトから、サロンの施術メニュー情報を抽出してください。
        URL: https://yutakarelax.wordpress.com/%e4%b8%89%e7%94%b0%e4%b8%89%e8%bc%aa%e5%ba%97/
        
        各メニューについて、以下の情報を抽出してください：
        - メニュー名（正確な名称）
        - カテゴリー（マッサージ、アロマ、フェイシャル、ボディケア、その他のいずれか）
        - 所要時間（分単位、記載がない場合は推定値）
        - 料金（円）
        - 説明（メニューの特徴や内容）`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            menus: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  menu_name: { type: "string" },
                  category: { 
                    type: "string",
                    enum: ["マッサージ", "アロマ", "フェイシャル", "ボディケア", "その他"]
                  },
                  duration: { type: "number" },
                  price: { type: "number" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMenus(response.menus);

      // メニューをデータベースに登録
      for (const menu of response.menus) {
        await ServiceMenu.create({
          ...menu,
          is_active: true
        });
      }

      setStatus("success");
    } catch (error) {
      console.error("メニュー読み込みエラー:", error);
      setStatus("error");
    }

    setIsLoading(false);
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-2xl font-bold text-stone-800">
              メニュー情報の読み込み
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <p className="text-stone-600 mb-4">
                  ウェブサイトからメニュー情報を自動取得して登録します。
                </p>
                <p className="text-sm text-stone-500 mb-6">
                  URL: https://yutakarelax.wordpress.com/三田三輪店/
                </p>
              </div>

              <Button
                onClick={loadMenusFromWebsite}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    読み込み中...
                  </>
                ) : (
                  "メニュー情報を読み込む"
                )}
              </Button>

              {status === "success" && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">読み込み完了！</p>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    {menus.length}件のメニューを登録しました。
                  </p>
                  <div className="space-y-2">
                    {menus.map((menu, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-green-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-stone-800">{menu.menu_name}</p>
                            <p className="text-sm text-stone-600">{menu.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-stone-800">¥{menu.price.toLocaleString()}</p>
                            <p className="text-sm text-stone-500">{menu.duration}分</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-semibold">エラーが発生しました</p>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    メニュー情報の読み込みに失敗しました。もう一度お試しください。
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}