
import React, { useState, useEffect, useRef } from "react";
import { CustomerConsent, Customer, User, Staff } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RotateCcw, Save, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function CustomerConsentPage() {
  const [staffList, setStaffList] = useState([]);
  const [currentStaff, setCurrentStaff] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    has_medical_history: null,
    medical_history_detail: "",
    consent_date: new Date().toISOString().split('T')[0],
    signature_data: "",
    therapist_name: "",
    confirmed_by_therapist: false
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingSignature, setIsReadingSignature] = useState(false);
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // 高解像度対応
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      context.scale(dpr, dpr);
      
      // キャンバスのスタイル設定 (CSSサイズを維持)
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // 白い背景を設定
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // 描画設定
      context.strokeStyle = '#000000';
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.imageSmoothingEnabled = true;
      
      setCtx(context);
    }
  }, []);

  const loadData = async () => {
    try {
      const [staffData, user] = await Promise.all([
        Staff.list(),
        User.me()
      ]);
      
      // 在籍中のスタッフのみフィルター
      const activeStaff = staffData.filter(s => s.is_active);
      setStaffList(activeStaff);

      const currentStaffInfo = activeStaff.find(s => s.user_email === user.email);
      if (currentStaffInfo) {
        setCurrentStaff(currentStaffInfo);
        setFormData(prev => ({ ...prev, therapist_name: currentStaffInfo.name }));
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const startDrawing = (e) => {
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && ctx) {
      ctx.closePath(); // パスを閉じる
    }
    setIsDrawing(false);
  };

  const startDrawingTouch = (e) => {
    if (!ctx) return;
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left);
    const y = (touch.clientY - rect.top);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawTouch = (e) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left);
    const y = (touch.clientY - rect.top);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // 白い背景で塗りつぶし
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 描画設定を再設定（クリアで失われる可能性があるため）
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
  };

  const handleReadSignature = async () => {
    if (!canvasRef.current) {
      alert("署名を入力してください");
      return;
    }

    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasSignature = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        hasSignature = true;
        break;
      }
    }

    if (!hasSignature) {
      alert("署名を入力してください");
      return;
    }

    setIsReadingSignature(true);

    try {
      const signatureData = canvas.toDataURL("image/png", 1.0);
      const blob = await (await fetch(signatureData)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      
      let file_url;
      try {
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        file_url = uploadResult.file_url;
      } catch (uploadError) {
        console.error("ファイルアップロードエラー:", uploadError);
        throw new Error("ファイルのアップロードに失敗しました。ネットワーク接続を確認してください。");
      }
      
      let result;
      try {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: `あなたは日本語の手書き文字認識の専門家です。
この画像には手書きの署名が含まれています。

【タスク】
署名から日本人の名前（姓名）を正確に読み取ってください。

【重要な観察ポイント】
1. 文字の形状：漢字、ひらがな、カタカナのいずれかを判断
2. 画数：各文字の画数を数える
3. つながり：文字間の連結や続け字を考慮
4. 文字数：通常2〜5文字程度

【読み取りルール】
- 姓と名の間にスペースは入れない
- 「様」「殿」などの敬称は除外
- 崩し字や続け字も丁寧に解読
- 判読困難な文字は類似する一般的な名前から推測

【出力形式】
最も可能性が高い名前を1つだけ返してください。
名前以外の情報（説明、注釈など）は一切含めないでください。

例：
✓ 正しい出力：「山田太郎」「田中花子」「佐藤健」
✗ 間違った出力：「山田 太郎」「お名前：山田太郎」「山田太郎様」「読み取れません」

署名から読み取った名前：`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "読み取った名前（姓名、スペースなし）"
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "読み取りの信頼度"
              },
              alternative_readings: {
                type: "array",
                items: { type: "string" },
                description: "他の可能性のある読み方（最大3つ）"
              },
              notes: {
                type: "string",
                description: "判読が難しかった文字や特記事項"
              }
            },
            required: ["name", "confidence"]
          }
        });
      } catch (llmError) {
        console.error("LLM呼び出しエラー:", llmError);
        throw new Error("AIによる読み取りに失敗しました。もう一度お試しいただくか、手動で入力してください。");
      }

      console.log("署名読み取り結果:", result);

      if (result && result.name) {
        const extractedName = result.name.trim().replace(/\s+/g, '');
        
        const isValidName = 
          extractedName.length >= 2 && 
          extractedName.length <= 10 &&
          !extractedName.includes("読み取") &&
          !extractedName.includes("できません") &&
          !extractedName.includes("不明") &&
          !extractedName.includes("申し訳");

        if (isValidName) {
          setFormData(prev => ({ ...prev, customer_name: extractedName }));
          
          let message = `署名から「${extractedName}」を読み取りました。`;
          
          if (result.confidence === "low" || (result.alternative_readings && result.alternative_readings.length > 0)) {
            message += "\n\n他の可能性：";
            if (result.alternative_readings && result.alternative_readings.length > 0) {
              message += "\n" + result.alternative_readings.slice(0, 3).join("、");
            }
            message += "\n\n正しくない場合は手動で修正してください。";
          } else if (result.confidence === "medium") {
            message += "\n\n正しくない場合は手動で修正してください。";
          }
          
          if (result.notes) {
            message += "\n\n備考: " + result.notes;
          }
          
          alert(message);
        } else {
          throw new Error("読み取った内容が名前の形式ではありません");
        }
      } else {
        throw new Error("署名から名前を検出できませんでした");
      }
    } catch (error) {
      console.error("署名読み取りエラー:", error);
      
      let errorMessage = "署名から名前を読み取れませんでした。\n\n";
      
      if (error.message && error.message.includes("タイムアウト")) {
        errorMessage += "⚠️ 通信がタイムアウトしました。\n• インターネット接続を確認してください\n• もう一度お試しください\n• または手動で名前を入力してください";
      } else if (error.message && error.message.includes("ネットワーク")) {
        errorMessage += "⚠️ ネットワークエラー\n• インターネット接続を確認してください\n• もう一度お試しください\n• または手動で名前を入力してください";
      } else {
        errorMessage += "💡 以下をお試しください：\n• もう少し大きくはっきりと書く\n• 文字を離して書く\n• もう一度読み取りボタンを押す\n• または手動で名前を入力する";
      }
      
      alert(errorMessage);
    } finally {
      setIsReadingSignature(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_phone) {
      alert("お名前と電話番号を入力してください");
      return;
    }

    if (formData.has_medical_history === null) {
      alert("病気やケガの履歴について選択してください");
      return;
    }

    if (formData.has_medical_history && !formData.medical_history_detail) {
      alert("病気やケガをした時期を入力してください");
      return;
    }

    if (!formData.therapist_name) {
      alert("担当セラピストを選択してください");
      return;
    }

    if (!canvasRef.current) {
      alert("署名を入力してください");
      return;
    }

    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasSignature = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        hasSignature = true;
        break;
      }
    }

    if (!hasSignature) {
      alert("署名を入力してください");
      return;
    }

    setIsSaving(true);

    try {
      const signatureData = canvas.toDataURL("image/png", 1.0);

      // 既存顧客をチェック
      const existingCustomers = await Customer.list();
      const duplicateCustomer = existingCustomers.find(c => 
        c.phone === formData.customer_phone
      );

      let customerId;
      let customerName;

      if (duplicateCustomer) {
        // 既存顧客がいる場合、確認
        const confirmResult = confirm(
          `この電話番号（${formData.customer_phone}）は既に「${duplicateCustomer.name}」様で登録されています。\n\n` +
          `既存の顧客情報に同意書を紐付けますか？\n\n` +
          `「OK」: 既存顧客に紐付ける\n` +
          `「キャンセル」: 新規顧客として登録する`
        );

        if (confirmResult) {
          // 既存顧客に紐付ける
          customerId = duplicateCustomer.id;
          customerName = duplicateCustomer.name;
        } else {
          // 新規顧客として登録
          const newCustomer = await Customer.create({
            name: formData.customer_name,
            phone: formData.customer_phone,
            first_visit_date: formData.consent_date
          });
          customerId = newCustomer.id;
          customerName = newCustomer.name;
        }
      } else {
        // 新規顧客を登録
        const newCustomer = await Customer.create({
          name: formData.customer_name,
          phone: formData.customer_phone,
          first_visit_date: formData.consent_date
        });
        customerId = newCustomer.id;
        customerName = newCustomer.name;
      }

      // 同意書を保存
      await CustomerConsent.create({
        customer_id: customerId,
        customer_name: customerName,
        has_medical_history: formData.has_medical_history,
        medical_history_detail: formData.medical_history_detail,
        consent_date: formData.consent_date,
        signature_data: signatureData,
        therapist_name: formData.therapist_name,
        confirmed_by_therapist: true
      });

      alert("同意書を保存しました");
      
      // フォームをリセット
      setFormData({
        customer_name: "",
        customer_phone: "",
        has_medical_history: null,
        medical_history_detail: "",
        consent_date: new Date().toISOString().split('T')[0],
        signature_data: "",
        therapist_name: currentStaff?.name || "",
        confirmed_by_therapist: false
      });
      clearSignature();
    } catch (error) {
      console.error("同意書保存エラー:", error);
      alert("同意書の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-stone-50 via-green-50/30 to-stone-100">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="border-b-4 border-green-500 bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-400 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-stone-600">一般社団法人</p>
                  <CardTitle className="text-2xl font-bold text-green-900">
                    日本リラクゼーション業協会
                  </CardTitle>
                  <p className="text-sm text-stone-600 mt-1">Association of Japan Relaxation Industry</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-stone-800 py-3 border-t border-b border-green-200">
                協会認定スペースをご利用いただくにあたって
              </h2>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-stone-700 mb-2">ご利用ありがとうございます。</p>
                  <p className="text-stone-700">以下、ご承認およびご記載の上、ご署名をお願いいたします。</p>
                </div>

                <div className="space-y-4 bg-stone-50 p-6 rounded-lg border border-stone-200">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-stone-600 rounded-full mt-2 flex-shrink-0"></span>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      <strong>当店でのサービスは、あん摩・マッサージ・指圧など治療を目的とした医業（類似）行為ではありません。</strong><br/>
                      また、骨格矯正、脊柱に対するスラスト・アジャスト施術は行っておりません。
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-stone-600 rounded-full mt-2 flex-shrink-0"></span>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      <strong>万一、サービス中に体調の異常を感じたときには、その場でただちにお申し出ください。</strong><br/>
                      サービス後に店外で発症した傷病や、医師による因果関係の証明不能な傷病は、当店にて責任を負いかねますのでご了承ください。
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">お名前 *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="山田 太郎"
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">電話番号 *</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="090-1234-5678"
                        className="bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <Label className="text-base font-semibold text-stone-800 flex items-start gap-2">
                      <span className="w-2 h-2 bg-stone-600 rounded-full mt-2 flex-shrink-0"></span>
                      現在、または今までに大きな病気やケガをしたことがありますか？ *
                    </Label>
                    <RadioGroup
                      value={formData.has_medical_history === null ? "" : formData.has_medical_history.toString()}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        has_medical_history: value === "true",
                        medical_history_detail: value === "false" ? "" : prev.medical_history_detail
                      }))}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="yes" />
                        <Label htmlFor="yes" className="cursor-pointer font-normal">はい</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="no" />
                        <Label htmlFor="no" className="cursor-pointer font-normal">いいえ</Label>
                      </div>
                    </RadioGroup>

                    {formData.has_medical_history && (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="medical_history_detail">いつ頃：</Label>
                        <Input
                          id="medical_history_detail"
                          value={formData.medical_history_detail}
                          onChange={(e) => setFormData(prev => ({ ...prev, medical_history_detail: e.target.value }))}
                          placeholder="例: 2020年頃、3年前など"
                          className="bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consent_date">年月日 *</Label>
                      <Input
                        id="consent_date"
                        type="date"
                        value={formData.consent_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, consent_date: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-stone-800">ご署名 *</Label>
                    <p className="text-sm text-stone-600">
                      下のエリアに署名してください。できるだけ大きく、はっきりと書いてください。
                    </p>
                    <div className="border-4 border-green-200 rounded-lg bg-white p-2 shadow-inner">
                      <canvas
                        ref={canvasRef}
                        className="w-full touch-none cursor-crosshair border-2 border-dashed border-stone-300 rounded bg-white"
                        style={{ height: '250px' }}
                        onMouseDown={(e) => {
                          if (!ctx) return;
                          setIsDrawing(true);
                          const rect = canvasRef.current.getBoundingClientRect();
                          const x = (e.clientX - rect.left);
                          const y = (e.clientY - rect.top);
                          ctx.beginPath();
                          ctx.moveTo(x, y);
                        }}
                        onMouseMove={(e) => {
                          if (!isDrawing || !ctx) return;
                          const rect = canvasRef.current.getBoundingClientRect();
                          const x = (e.clientX - rect.left);
                          const y = (e.clientY - rect.top);
                          ctx.lineTo(x, y);
                          ctx.stroke();
                        }}
                        onMouseUp={() => {
                          if (isDrawing && ctx) {
                            ctx.closePath();
                          }
                          setIsDrawing(false);
                        }}
                        onMouseLeave={() => {
                          if (isDrawing && ctx) {
                            ctx.closePath();
                          }
                          setIsDrawing(false);
                        }}
                        onTouchStart={(e) => {
                          if (!ctx) return;
                          e.preventDefault();
                          setIsDrawing(true);
                          const rect = canvasRef.current.getBoundingClientRect();
                          const touch = e.touches[0];
                          const x = (touch.clientX - rect.left);
                          const y = (touch.clientY - rect.top);
                          ctx.beginPath();
                          ctx.moveTo(x, y);
                        }}
                        onTouchMove={(e) => {
                          if (!isDrawing || !ctx) return;
                          e.preventDefault();
                          const rect = canvasRef.current.getBoundingClientRect();
                          const touch = e.touches[0];
                          const x = (touch.clientX - rect.left);
                          const y = (touch.clientY - rect.top);
                          ctx.lineTo(x, y);
                          ctx.stroke();
                        }}
                        onTouchEnd={() => {
                          if (isDrawing && ctx) {
                            ctx.closePath();
                          }
                          setIsDrawing(false);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!ctx || !canvasRef.current) return;
                          const canvas = canvasRef.current;
                          ctx.fillStyle = '#FFFFFF';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.strokeStyle = '#000000';
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          ctx.imageSmoothingEnabled = true;
                        }}
                        className="border-stone-300"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        署名をクリア
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReadSignature}
                        disabled={isReadingSignature}
                        className="bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500"
                      >
                        {isReadingSignature ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            読み取り中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            署名から名前を読み取る
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-200">
                    <Label htmlFor="therapist_name" className="font-semibold text-green-900">
                      担当セラピスト *
                    </Label>
                    <Select
                      value={formData.therapist_name}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, therapist_name: value }))}
                      required
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="担当セラピストを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name}
                            {staff.position && ` (${staff.position})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-stone-500 mt-1">
                      ※ 施術後、お客様に確認したセラピストを選択してください
                    </p>
                  </div>
                </div>

                <div className="text-center text-xs text-stone-500 py-4 border-t border-stone-200">
                  ※一般社団法人日本リラクゼーション業協会指定につき会員以外の複製を禁ずる
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-lg py-6"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSaving ? "保存中..." : "同意書を保存"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
