import React, { useState } from "react";
import { Customer } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ImportCustomers() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setDebugInfo(null);
    }
  };

  const parseCSV = (text) => {
    // いろいろな区切り文字を試す
    const delimiters = [',', '\t', ';', '|'];
    let bestDelimiter = ',';
    let maxColumns = 0;

    for (const delimiter of delimiters) {
      const firstLine = text.split('\n')[0];
      const columns = firstLine.split(delimiter).length;
      if (columns > maxColumns) {
        maxColumns = columns;
        bestDelimiter = delimiter;
      }
    }

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(bestDelimiter).map(h => h.trim().replace(/"/g, '').replace(/\r/g, ''));
    const customers = [];

    setDebugInfo({
      delimiter: bestDelimiter,
      totalLines: lines.length,
      headers: headers,
      firstDataLine: lines[1] ? lines[1].split(bestDelimiter).map(v => v.trim().replace(/"/g, '')) : []
    });

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(bestDelimiter).map(v => v.trim().replace(/"/g, '').replace(/\r/g, ''));
      const customer = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        const lowerHeader = header.toLowerCase();
        
        // より柔軟なマッピング
        if (lowerHeader.includes('名前') || lowerHeader.includes('氏名') || lowerHeader.includes('name') || lowerHeader === '顧客名') {
          customer.name = value;
        } else if (lowerHeader.includes('フリガナ') || lowerHeader.includes('ふりがな') || lowerHeader.includes('kana')) {
          customer.name_kana = value;
        } else if (lowerHeader.includes('電話') || lowerHeader.includes('tel') || lowerHeader.includes('phone') || lowerHeader === '携帯電話') {
          customer.phone = value;
        } else if (lowerHeader.includes('メール') || lowerHeader.includes('mail') || lowerHeader.includes('email')) {
          customer.email = value;
        } else if (lowerHeader.includes('生年月日') || lowerHeader.includes('誕生日') || lowerHeader.includes('birth')) {
          customer.birth_date = value;
        } else if (lowerHeader.includes('性別') || lowerHeader.includes('gender')) {
          if (value.includes('男') || value.toLowerCase() === 'male' || value === 'M') {
            customer.gender = 'male';
          } else if (value.includes('女') || value.toLowerCase() === 'female' || value === 'F') {
            customer.gender = 'female';
          } else if (value) {
            customer.gender = 'other';
          }
        } else if (lowerHeader.includes('住所') || lowerHeader.includes('address')) {
          customer.address = value;
        } else if (lowerHeader.includes('初回') || lowerHeader.includes('first_visit')) {
          customer.first_visit_date = value;
        }
      });

      // 名前と電話番号があれば追加
      if (customer.name && customer.name.length > 0 && customer.phone && customer.phone.length > 0) {
        customers.push(customer);
      }
    }

    return customers;
  };

  const handleImport = async () => {
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setDebugInfo(null);

    try {
      // ファイルを読み込む
      const text = await file.text();
      
      // CSVをパース
      const customers = parseCSV(text);
      
      if (customers.length === 0) {
        throw new Error("有効な顧客データが見つかりませんでした。デバッグ情報を確認してください。");
      }

      // 顧客を一括登録
      let successCount = 0;
      let errorCount = 0;
      
      for (const customerData of customers) {
        try {
          await Customer.create(customerData);
          successCount++;
        } catch (err) {
          console.error("顧客登録エラー:", err);
          errorCount++;
        }
      }

      setResult({
        total: customers.length,
        success: successCount,
        error: errorCount
      });

    } catch (err) {
      console.error("インポートエラー:", err);
      setError(err.message || "インポート中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800">顧客データインポート</h1>
          <p className="text-stone-600 mt-1">CSVファイルから顧客を一括登録</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-xl font-bold text-stone-800">
              CSVファイルをアップロード
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-stone-400" />
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-xs mx-auto"
                />
                {file && (
                  <p className="mt-4 text-sm text-stone-600">
                    選択されたファイル: <span className="font-semibold">{file.name}</span>
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 CSVフォーマットについて</h3>
                <p className="text-sm text-blue-800 mb-2">
                  以下のような列を含むCSVファイルに対応しています：
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>名前、氏名、name → 顧客名（必須）</li>
                  <li>フリガナ、ふりがな、name_kana → ふりがな</li>
                  <li>電話、TEL、phone → 電話番号（必須）</li>
                  <li>メール、email → メールアドレス</li>
                  <li>生年月日、誕生日、birth_date → 生年月日</li>
                  <li>性別、gender → 性別</li>
                  <li>住所、address → 住所</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">
                  ※ Salonboardからエクスポートしたファイルをそのまま使えます
                </p>
              </div>

              {debugInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">🔍 デバッグ情報</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p><strong>区切り文字:</strong> {debugInfo.delimiter === '\t' ? 'タブ' : debugInfo.delimiter}</p>
                    <p><strong>総行数:</strong> {debugInfo.totalLines}</p>
                    <p><strong>列名:</strong> {debugInfo.headers.join(', ')}</p>
                    <p><strong>最初のデータ:</strong> {debugInfo.firstDataLine.join(' | ')}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">エラー</h3>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">インポート完了</h3>
                    <p className="text-sm text-green-800">
                      {result.success}件の顧客を登録しました
                      {result.error > 0 && ` （${result.error}件失敗）`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Customers"))}
                  disabled={isProcessing}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || isProcessing}
                  className="bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      インポート開始
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}