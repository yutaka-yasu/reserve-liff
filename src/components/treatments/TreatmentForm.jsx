
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { X, Save, Star, ChevronDown, Check, ChevronsUpDown, Percent } from "lucide-react";
import { ServiceMenu } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";


export default function TreatmentForm({ treatment, customers, staff, onSubmit, onCancel }) {
  // Initialize formData with default empty values.
  // The useEffect below will populate it if a 'treatment' prop is provided.
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    staff_id: "",
    staff_name: "",
    is_nominated: false,
    treatment_date: new Date().toISOString().split('T')[0],
    service_menu: "",
    duration: "",
    chief_complaint: "",
    conversation: "",
    precautions: "",
    staff_notes: "",
    pressure_level: "普通",
    price: "",
    discount: "" // Add discount field
  });

  const [menus, setMenus] = useState([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [basePrice, setBasePrice] = useState(0); // Price derived purely from selected menus
  const [menuPopoverOpen, setMenuPopoverOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  // Ref to track if multi-select menu functionality has been used or if treatment's service_menu was from multi-select
  const hasUsedMultiSelectRef = useRef(false);

  // Load menus on component mount
  useEffect(() => {
    loadMenus();
  }, []);

  // Effect to initialize/reset form data when treatment prop or menus change
  useEffect(() => {
    if (treatment) {
      // Set formData from existing treatment
      setFormData({
        customer_id: treatment.customer_id || "",
        customer_name: treatment.customer_name || "",
        staff_id: treatment.staff_id || "",
        staff_name: treatment.staff_name || "",
        is_nominated: treatment.is_nominated || false,
        treatment_date: treatment.treatment_date || new Date().toISOString().split('T')[0],
        service_menu: treatment.service_menu || "",
        duration: treatment.duration || "",
        chief_complaint: treatment.chief_complaint || "",
        conversation: treatment.conversation || "",
        precautions: treatment.precautions || "",
        staff_notes: treatment.staff_notes || "",
        pressure_level: treatment.pressure_level || "普通",
        price: treatment.price || "",
        discount: treatment.discount || "" // Populate discount from treatment
      });
      
      // Calculate initial basePrice for existing treatment
      // treatment.price is the final price, so we need to reverse the calculations to get basePrice
      const initialTreatmentPrice = parseFloat(treatment.price) || 0;
      const initialNominationFee = treatment.is_nominated ? 300 : 0;
      const initialDiscount = parseFloat(treatment.discount) || 0;
      
      // basePrice = finalPrice - nominationFee + discount
      const calculatedBasePrice = initialTreatmentPrice - initialNominationFee + initialDiscount;
      setBasePrice(calculatedBasePrice);

      // Attempt to reconstruct selectedMenus if menus are loaded and service_menu looks like a combined string
      if (treatment.service_menu && menus.length > 0) {
        const serviceMenuNames = treatment.service_menu.split(' + ').map(name => name.trim());
        const matchedMenus = menus.filter(menu => serviceMenuNames.includes(menu.menu_name));
        
        // Only consider it a multi-select if all names from the string are found in available menus
        // AND the total duration/price match (to differentiate from manually typed similar strings)
        if (matchedMenus.length > 0 && matchedMenus.length === serviceMenuNames.length) {
          const totalDurationMatched = matchedMenus.reduce((sum, menu) => sum + (menu.duration || 0), 0);
          const totalPriceMatched = matchedMenus.reduce((sum, menu) => sum + (menu.price || 0), 0);

          const durationMatches = Math.abs(totalDurationMatched - (parseFloat(treatment.duration) || 0)) < 0.01;
          const priceMatches = Math.abs(totalPriceMatched - calculatedBasePrice) < 0.01;
          
          if (durationMatches && priceMatches) {
            setSelectedMenus(matchedMenus);
            hasUsedMultiSelectRef.current = true; // Mark as having used multi-select
          } else {
            setSelectedMenus([]); // Mismatch, treat as manual input
            hasUsedMultiSelectRef.current = false; // It was manual input, or couldn't be parsed
          }
        } else {
          setSelectedMenus([]); // Not a recognizable multi-select string
          hasUsedMultiSelectRef.current = false; // It was manual input, or couldn't be parsed
        }
      } else {
        setSelectedMenus([]); // No service menu or menus not loaded yet, default to manual input
        hasUsedMultiSelectRef.current = false;
      }
    } else {
      // Reset form for new creation (when treatment becomes null or undefined)
      setFormData({
        customer_id: "", customer_name: "", staff_id: "", staff_name: "",
        is_nominated: false, treatment_date: new Date().toISOString().split('T')[0],
        service_menu: "", duration: "", chief_complaint: "", conversation: "",
        precautions: "", staff_notes: "", pressure_level: "普通", price: "", discount: "" // Reset discount
      });
      setSelectedMenus([]);
      setBasePrice(0);
      hasUsedMultiSelectRef.current = false; // For new forms, start fresh
    }
  }, [treatment, menus]); // Rerun when treatment prop or menus change

  // Calculate basePrice, service_menu, and duration from selectedMenus
  useEffect(() => {
    if (selectedMenus.length > 0) {
      hasUsedMultiSelectRef.current = true; // User has actively selected menus
      const totalDuration = selectedMenus.reduce((sum, menu) => sum + (menu.duration || 0), 0);
      const totalPrice = selectedMenus.reduce((sum, menu) => sum + (menu.price || 0), 0);
      
      setBasePrice(totalPrice); // Set basePrice from selected menus
      const menuNames = selectedMenus.map(m => m.menu_name).join(" + ");
      
      setFormData(prev => ({
        ...prev,
        service_menu: menuNames,
        duration: totalDuration,
        // Price will be calculated by the dedicated price effect
      }));
    } else {
      // If selectedMenus becomes empty:
      // Only clear `service_menu`, `duration` if it's a new form,
      // OR if the user previously used the multi-select dropdown and now cleared it.
      // Do NOT clear if it's an edit form and `service_menu` was originally manual input
      // (indicated by `hasUsedMultiSelectRef.current` being false and `treatment` existing).
      if (!treatment || hasUsedMultiSelectRef.current) {
        setFormData(prev => ({
          ...prev,
          service_menu: "",
          duration: "",
        }));
        setBasePrice(0); // Base price is 0 if no menus are selected
      }
    }
  }, [selectedMenus, treatment]);

  // Dedicated effect to calculate formData.price based on basePrice, nomination fee, and discount
  useEffect(() => {
    const nominationFee = formData.is_nominated ? 300 : 0;
    const discountAmount = parseFloat(formData.discount) || 0;
    
    setFormData(prev => ({
      ...prev,
      price: Math.max(0, basePrice + nominationFee - discountAmount) // Ensure price doesn't go below 0
    }));
  }, [formData.is_nominated, formData.discount, basePrice]); // Rerun when these dependencies change

  const loadMenus = async () => {
    try {
      const menuData = await ServiceMenu.filter({ is_active: true });
      setMenus(menuData);
    } catch (err) {
      console.error("Error loading menus:", err);
      setMenus([]);
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.customer_name) {
      alert("顧客を選択してください");
      return;
    }
    if (!formData.service_menu) {
      alert("施術メニューを入力してください");
      return;
    }
    if (!formData.treatment_date) {
      alert("施術日を選択してください");
      return;
    }

    // 送信前にデータをクリーンアップ
    const submitData = {
      ...formData,
      discount: formData.discount && formData.discount !== "" ? parseFloat(formData.discount) : 0,
      price: formData.price && formData.price !== "" ? parseFloat(formData.price) : 0,
      duration: formData.duration && formData.duration !== "" ? parseFloat(formData.duration) : 0
    };

    console.log("Submitting treatment data:", submitData);
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    // If user manually changes service_menu, duration, or price, switch to manual input mode behavior
    if (field === "service_menu" || field === "duration") {
      // If service_menu is manually changed, clear selectedMenus and mark as manual input
      setSelectedMenus([]);
      hasUsedMultiSelectRef.current = false;
    }
    
    if (field === "price") {
      hasUsedMultiSelectRef.current = false; // Manually editing price, so not using multi-select calculation
      const newPrice = parseFloat(value) || 0;
      const nominationFee = formData.is_nominated ? 300 : 0;
      const discountAmount = parseFloat(formData.discount) || 0;
      
      // Infer basePrice from manually entered price
      setBasePrice(newPrice - nominationFee + discountAmount);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (customerId) => {
    const customer = (customers || []).find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name
      }));
      setCustomerSearchOpen(false); // Close popover after selection
    }
  };

  const handleStaffChange = (staffId) => {
    const staffMember = (staff || []).find(s => s.id === staffId);
    if (staffMember) {
      setFormData(prev => ({
        ...prev,
        staff_id: staffId,
        staff_name: staffMember.name
      }));
    }
  };

  const handleMenuToggle = (menu) => {
    setSelectedMenus(prev => {
      const isSelected = prev.find(m => m.id === menu.id);
      let newSelectedMenus;
      if (isSelected) {
        newSelectedMenus = prev.filter(m => m.id !== menu.id);
      } else {
        newSelectedMenus = [...prev, menu];
      }
      // When a menu is toggled, we are definitely in multi-select mode
      hasUsedMultiSelectRef.current = true;
      return newSelectedMenus;
    });
  };

  const nominationFee = formData.is_nominated ? 300 : 0;
  const discountAmount = parseFloat(formData.discount) || 0;
  const finalPrice = Math.max(0, basePrice + nominationFee - discountAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-xl font-bold text-stone-800">
            {treatment ? "カルテ編集" : "新規カルテ作成"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_id">顧客 *</Label>
                {formData.customer_name ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <p className="font-semibold text-stone-800">{formData.customer_name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, customer_id: "", customer_name: "" }))}
                      className="text-stone-600 hover:text-stone-900"
                    >
                      変更
                    </Button>
                  </div>
                ) : (
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className="w-full justify-between bg-white border-stone-200"
                      >
                        顧客を検索...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="顧客名、電話番号で検索..." />
                        <CommandList>
                          <CommandEmpty>顧客が見つかりません</CommandEmpty>
                          <CommandGroup>
                            {(customers || []).map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.phone || ''} ${customer.name_kana || ''}`}
                                onSelect={() => handleCustomerChange(customer.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div>
                                  <div className="font-medium">{customer.name}</div>
                                  {customer.phone && (
                                    <div className="text-xs text-stone-500">{customer.phone}</div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_id">担当スタッフ</Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={handleStaffChange}
                >
                  <SelectTrigger className="bg-white border-stone-200">
                    <SelectValue placeholder="スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(staff || []).filter(s => s.is_active).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.position && `(${member.position})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.staff_id && (
                  <div className="flex items-center space-x-2 mt-2 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <Checkbox
                      id="is_nominated"
                      checked={formData.is_nominated}
                      onCheckedChange={(checked) => handleChange("is_nominated", checked)}
                    />
                    <Label
                      htmlFor="is_nominated"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <Star className="w-4 h-4 text-amber-600" />
                      指名（+¥300）
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment_date">施術日 *</Label>
                <Input
                  id="treatment_date"
                  type="date"
                  value={formData.treatment_date}
                  onChange={(e) => handleChange("treatment_date", e.target.value)}
                  required
                  className="bg-white border-stone-200"
                />
              </div>
            </div>

            {/* メニュー複数選択（同じプルダウン） */}
            <div className="space-y-4">
              <Label>施術メニュー *</Label>
              
              <Popover open={menuPopoverOpen} onOpenChange={setMenuPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between bg-white border-stone-200 h-auto min-h-[42px] py-2"
                  >
                    <span className="text-left flex-1">
                      {selectedMenus.length === 0 ? (
                        <span className="text-stone-500">メニューを選択</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {selectedMenus.map((menu) => (
                            <Badge key={menu.id} variant="secondary" className="bg-purple-100 text-purple-800">
                              {menu.menu_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {menus.map((menu) => {
                      const isSelected = selectedMenus.find(m => m.id === menu.id);
                      return (
                        <div
                          key={menu.id}
                          className="flex items-start gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-0"
                          onClick={() => handleMenuToggle(menu)}
                        >
                          <Checkbox
                            checked={!!isSelected}
                            onCheckedChange={() => handleMenuToggle(menu)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-stone-800">{menu.menu_name}</p>
                            <p className="text-sm text-stone-600">
                              {menu.duration}分 / ¥{menu.price?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedMenus.length > 0 && (
                    <div className="p-3 border-t border-stone-200 bg-stone-50">
                      <Button
                        type="button"
                        onClick={() => setMenuPopoverOpen(false)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        選択完了（{selectedMenus.length}件）
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* 合計表示 */}
              {selectedMenus.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg">
                  <div className="space-y-2 mb-3">
                    {selectedMenus.map((menu) => (
                      <div key={menu.id} className="flex justify-between text-sm text-indigo-900">
                        <span>{menu.menu_name}</span>
                        <span>{menu.duration}分 / ¥{menu.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-indigo-200 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">合計時間</span>
                      <span className="text-xl font-bold text-indigo-900">{formData.duration}分</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">基本料金</span>
                      <span className="text-xl font-bold text-indigo-900">¥{basePrice.toLocaleString()}</span>
                    </div>
                    {formData.is_nominated && (
                      <div className="flex items-center justify-between text-amber-700">
                        <span className="font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          指名料
                        </span>
                        <span className="text-lg font-bold">¥300</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-red-700">
                        <span className="font-semibold flex items-center gap-1">
                          <Percent className="w-4 h-4" />
                          割引
                        </span>
                        <span className="text-lg font-bold">-¥{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold text-purple-900">合計料金</span>
                      <span className="text-2xl font-bold text-purple-900">¥{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 手動入力オプション */}
              <div className="pt-2">
                <p className="text-xs text-stone-500 mb-2">またはメニューを手動で入力：</p>
                <Input
                  id="service_menu"
                  value={formData.service_menu}
                  onChange={(e) => {
                    handleChange("service_menu", e.target.value);
                  }}
                  placeholder="例: アロマオイルマッサージ"
                  className="bg-white border-stone-200"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4"> {/* Changed to 3 columns for duration, discount, price */}
                <div className="space-y-2">
                  <Label htmlFor="duration">施術時間（分）</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange("duration", parseFloat(e.target.value) || "")}
                    placeholder="60"
                    className="bg-white border-stone-200"
                  />
                </div>

                {/* Discount Input Field */}
                <div className="space-y-2">
                  <Label htmlFor="discount" className="flex items-center gap-1">
                    <Percent className="w-4 h-4 text-red-600" />
                    割引（円）
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleChange("discount", e.target.value)}
                    placeholder="0"
                    className="bg-white border-stone-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">料金</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      handleChange("price", parseFloat(e.target.value) || "");
                    }}
                    placeholder="5000"
                    className="bg-white border-stone-200"
                  />
                  {(formData.is_nominated || discountAmount > 0) && (
                    <p className="text-xs text-stone-600">
                      {formData.is_nominated && "※ 指名料¥300含む"}
                      {formData.is_nominated && discountAmount > 0 && "、"}
                      {discountAmount > 0 && `割引¥${discountAmount.toLocaleString()}適用済み`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pressure_level">圧の強さ</Label>
              <Select
                value={formData.pressure_level}
                onValueChange={(value) => handleChange("pressure_level", value)}
              >
                <SelectTrigger className="bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="弱め">弱め</SelectItem>
                  <SelectItem value="普通">普通</SelectItem>
                  <SelectItem value="強め">強め</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chief_complaint">主訴</Label>
              <Textarea
                id="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => handleChange("chief_complaint", e.target.value)}
                placeholder="お客様の主な訴え（肩こり、腰痛など）"
                className="bg-white border-stone-200 h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversation">会話</Label>
              <Textarea
                id="conversation"
                value={formData.conversation}
                onChange={(e) => handleChange("conversation", e.target.value)}
                placeholder="お客様との会話内容"
                className="bg-white border-stone-200 h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precautions">注意事項</Label>
              <Textarea
                id="precautions"
                value={formData.precautions}
                onChange={(e) => handleChange("precautions", e.target.value)}
                placeholder="施術における注意事項"
                className="bg-white border-stone-200 h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_notes">スタッフメモ</Label>
              <Textarea
                id="staff_notes"
                value={formData.staff_notes}
                onChange={(e) => handleChange("staff_notes", e.target.value)}
                placeholder="内部メモ"
                className="bg-white border-stone-200 h-20"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-stone-300 hover:bg-stone-50"
              >
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {treatment ? "更新" : "保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
