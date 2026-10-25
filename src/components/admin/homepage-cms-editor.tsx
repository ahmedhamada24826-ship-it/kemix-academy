"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/upload/image-upload-field";
import { PlusCircle, Trash2, ArrowUp, ArrowDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Homepage CMS contract (mirrors src/server/domain/settings/homepage-cms.ts)
// ─────────────────────────────────────────────────────────────────────────────

export interface CmsStatItem {
  value: string;
  label: string;
}

export interface CmsFeatureItem {
  title: string;
  description: string;
}

export interface CmsTestimonialItem {
  quote: string;
  author: string;
  role: string;
  badge: string;
}

export interface CmsSkillItem {
  title: string;
  englishTitle: string;
  description: string;
  query: string;
  icon: "chart" | "code" | "database" | "dashboard";
}

export interface HomepageCms {
  preferences: {
    theme: "light" | "dark";
    locale: "ar" | "en";
  };
  hero: {
    enabled: boolean;
    sortOrder: number;
    badge: string;
    heading: string;
    subheading: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    imageUrl: string;
    videoUrl: string;
    videoTitle: string;
  };
  stats: { enabled: boolean; sortOrder: number; items: CmsStatItem[] };
  impact: { enabled: boolean; sortOrder: number; items: string[] };
  skills: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    items: CmsSkillItem[];
  };
  featuredCourses: { enabled: boolean; sortOrder: number; heading: string; description: string };
  dataStory: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    imageAlt: string;
    note: string;
  };
  build: {
    enabled: boolean;
    sortOrder: number;
    eyebrow: string;
    heading: string;
    description: string;
    imageAlt: string;
    steps: string[];
  };
  about: { enabled: boolean; sortOrder: number; heading: string; description: string; imageUrl: string };
  features: { enabled: boolean; sortOrder: number; heading: string; description: string; items: CmsFeatureItem[] };
  instructors: { enabled: boolean; sortOrder: number; heading: string; description: string };
  testimonials: { enabled: boolean; sortOrder: number; heading: string; items: CmsTestimonialItem[] };
  cta: { enabled: boolean; sortOrder: number; heading: string; description: string; buttonText: string };
  footer: { enabled: boolean; sortOrder: number };
  visuals: {
    heroImageUrl: string;
    dataStoryImageUrl: string;
    buildImageUrl: string;
    innovationImageUrl: string;
  };
}

export type CmsSectionKey = keyof HomepageCms;

interface SectionShellProps {
  title: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
  onToggle: (enabled: boolean) => void;
  onSortOrder: (sortOrder: number) => void;
  showOrder?: boolean;
  children: React.ReactNode;
}

function SectionShell({
  title,
  description,
  enabled,
  sortOrder,
  onToggle,
  onSortOrder,
  showOrder = true,
  children,
}: SectionShellProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold text-slate-900">{title}</CardTitle>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {showOrder && <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              <span>الترتيب</span>
              <input
                type="number"
                min={0}
                max={99}
                value={sortOrder}
                onChange={(e) => onSortOrder(Number(e.target.value) || 0)}
                className="h-7 w-16 rounded-md border border-slate-300 px-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </label>}
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>مفعّل</span>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  ltr?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
  rows = 3,
  mono,
  ltr,
}: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-700">{label}</label>
      {multiline ? (
        <Textarea
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs leading-relaxed"
        />
      ) : (
        <Input
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`text-xs h-9 ${mono ? "font-mono" : ""} ${ltr ? "dir-ltr text-left" : ""}`}
        />
      )}
    </div>
  );
}

interface ListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  addLabel: string;
  maxItems: number;
}

function ListEditor<T>({
  items,
  onChange,
  createItem,
  renderItem,
  addLabel,
  maxItems,
}: ListEditorProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 font-mono">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                aria-label="تحريك لأعلى"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                aria-label="تحريك لأسفل"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                aria-label="حذف العنصر"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {renderItem(item, (patch) => updateAt(index, patch), index)}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= maxItems}
        onClick={() => onChange([...items, createItem()])}
        className="h-8 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span>{addLabel}</span>
      </Button>
    </div>
  );
}

export interface HomepageCmsEditorProps {
  value: HomepageCms;
  onChange: (next: HomepageCms) => void;
}

export function HomepageCmsEditor({ value, onChange }: HomepageCmsEditorProps) {
  const setSection = <K extends CmsSectionKey>(key: K, patch: Partial<HomepageCms[K]>) => {
    onChange({ ...value, [key]: { ...(value[key] as object), ...patch } } as HomepageCms);
  };

  return (
    <div className="space-y-5">
      {/* HERO */}
      <SectionShell
        title="القسم الرئيسي (Hero)"
        description="العنوان الرئيسي ووصف المنصة وأزرار الدعوة للبدء أعلى الصفحة الرئيسية."
        enabled={value.hero.enabled}
        sortOrder={value.hero.sortOrder}
        onToggle={(enabled) => setSection("hero", { enabled })}
        onSortOrder={(sortOrder) => setSection("hero", { sortOrder })}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="الشارة العلوية"
            value={value.hero.badge}
            maxLength={200}
            onChange={(badge) => setSection("hero", { badge })}
          />
          <Field
            label="العنوان الفرعي"
            value={value.hero.subheading}
            maxLength={200}
            onChange={(subheading) => setSection("hero", { subheading })}
          />
        </div>
        <Field
          label="العنوان الرئيسي"
          value={value.hero.heading}
          maxLength={300}
          onChange={(heading) => setSection("hero", { heading })}
        />
        <Field
          label="الوصف"
          value={value.hero.description}
          maxLength={1000}
          multiline
          rows={3}
          onChange={(description) => setSection("hero", { description })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="نص الزر الرئيسي"
            value={value.hero.ctaPrimary}
            maxLength={80}
            onChange={(ctaPrimary) => setSection("hero", { ctaPrimary })}
          />
          <Field
            label="نص الزر الثانوي"
            value={value.hero.ctaSecondary}
            maxLength={80}
            onChange={(ctaSecondary) => setSection("hero", { ctaSecondary })}
          />
        </div>
      </SectionShell>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">صور الصفحة الرئيسية</CardTitle>
          <p className="text-[11px] text-slate-500">
            استبدل الصور برفع صورة جديدة أو رابط مباشر. إزالة الصورة تُخفيها من الصفحة الرئيسية ولا تحذف الملف من خدمة التخزين.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageUploadField
            label="الصورة الرئيسية"
            value={value.visuals.heroImageUrl}
            onChange={(heroImageUrl) => setSection("visuals", { heroImageUrl })}
            hint="الصورة البارزة بجانب عنوان الصفحة الرئيسية."
          />
          <ImageUploadField
            label="صورة تحليل البيانات"
            value={value.visuals.dataStoryImageUrl}
            onChange={(dataStoryImageUrl) => setSection("visuals", { dataStoryImageUrl })}
          />
          <ImageUploadField
            label="صورة التعلّم بالتطبيق"
            value={value.visuals.buildImageUrl}
            onChange={(buildImageUrl) => setSection("visuals", { buildImageUrl })}
          />
          <ImageUploadField
            label="صورة الابتكار"
            value={value.visuals.innovationImageUrl}
            onChange={(innovationImageUrl) => setSection("visuals", { innovationImageUrl })}
          />
        </CardContent>
      </Card>

      {/* STATS */}
      <SectionShell
        title="الأرقام والإحصاءات"
        description="أرقام الإنجاز المعروضة أسفل القسم الرئيسي."
        enabled={value.stats.enabled}
        sortOrder={value.stats.sortOrder}
        onToggle={(enabled) => setSection("stats", { enabled })}
        onSortOrder={(sortOrder) => setSection("stats", { sortOrder })}
      >
        <ListEditor
          items={value.stats.items}
          maxItems={8}
          addLabel="إضافة رقم إحصائي"
          createItem={() => ({ value: "", label: "" })}
          onChange={(items) => setSection("stats", { items })}
          renderItem={(item, update) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="القيمة"
                value={item.value}
                maxLength={80}
                onChange={(v) => update({ value: v })}
              />
              <Field
                label="الوصف"
                value={item.label}
                maxLength={120}
                onChange={(v) => update({ label: v })}
              />
            </div>
          )}
        />
      </SectionShell>

      <SectionShell
        title="محاور التعلّم"
        description="العبارات القصيرة الظاهرة بين القسم الرئيسي وبقية الصفحة."
        enabled={value.impact.enabled}
        sortOrder={value.impact.sortOrder}
        onToggle={(enabled) => setSection("impact", { enabled })}
        onSortOrder={(sortOrder) => setSection("impact", { sortOrder })}
      >
        <ListEditor
          items={value.impact.items.map((label) => ({ label }))}
          maxItems={8}
          addLabel="إضافة محور"
          createItem={() => ({ label: "" })}
          onChange={(items) => setSection("impact", { items: items.map((item) => item.label) })}
          renderItem={(item, update) => (
            <Field
              label="النص"
              value={item.label}
              maxLength={120}
              onChange={(label) => update({ label })}
            />
          )}
        />
      </SectionShell>

      <SectionShell
        title="مجالات التعلّم"
        description="عنوان ووصف وبطاقات مجالات المهارات المعروضة على الصفحة الرئيسية."
        enabled={value.skills.enabled}
        sortOrder={value.skills.sortOrder}
        onToggle={(enabled) => setSection("skills", { enabled })}
        onSortOrder={(sortOrder) => setSection("skills", { sortOrder })}
      >
        <Field label="الشارة" value={value.skills.eyebrow} maxLength={200} onChange={(eyebrow) => setSection("skills", { eyebrow })} />
        <Field label="العنوان" value={value.skills.heading} maxLength={200} onChange={(heading) => setSection("skills", { heading })} />
        <Field label="الوصف" value={value.skills.description} maxLength={600} multiline rows={2} onChange={(description) => setSection("skills", { description })} />
        <ListEditor
          items={value.skills.items}
          maxItems={8}
          addLabel="إضافة مجال"
          createItem={() => ({ title: "", englishTitle: "", description: "", query: "", icon: "chart" as const })}
          onChange={(items) => setSection("skills", { items })}
          renderItem={(item, update) => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="اسم المجال" value={item.title} maxLength={120} onChange={(title) => update({ title })} />
                <Field label="الاسم التقني" value={item.englishTitle} maxLength={120} ltr onChange={(englishTitle) => update({ englishTitle })} />
              </div>
              <Field label="الوصف" value={item.description} maxLength={600} multiline rows={2} onChange={(description) => update({ description })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="فلتر الكورسات" value={item.query} maxLength={120} ltr onChange={(query) => update({ query })} />
                <label className="space-y-1 text-[11px] font-bold text-slate-700">
                  <span>الأيقونة</span>
                  <select
                    value={item.icon}
                    onChange={(event) => update({ icon: event.target.value as CmsSkillItem["icon"] })}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="chart">تحليل البيانات</option>
                    <option value="code">برمجة</option>
                    <option value="database">قواعد البيانات</option>
                    <option value="dashboard">لوحات المعلومات</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        />
      </SectionShell>

      {/* FEATURED COURSES */}
      <SectionShell
        title="الكورسات المميزة"
        description="عنوان قسم الكورسات المميزة في الصفحة الرئيسية."
        enabled={value.featuredCourses.enabled}
        sortOrder={value.featuredCourses.sortOrder}
        onToggle={(enabled) => setSection("featuredCourses", { enabled })}
        onSortOrder={(sortOrder) => setSection("featuredCourses", { sortOrder })}
      >
        <Field
          label="العنوان"
          value={value.featuredCourses.heading}
          maxLength={200}
          onChange={(heading) => setSection("featuredCourses", { heading })}
        />
        <Field
          label="الوصف"
          value={value.featuredCourses.description}
          maxLength={600}
          multiline
          rows={2}
          onChange={(description) => setSection("featuredCourses", { description })}
        />
      </SectionShell>

      <SectionShell
        title="قصة تحليل البيانات"
        description="النصوص البديلة والتوضيحية بجانب صورة تحليل البيانات."
        enabled={value.dataStory.enabled}
        sortOrder={value.dataStory.sortOrder}
        onToggle={(enabled) => setSection("dataStory", { enabled })}
        onSortOrder={(sortOrder) => setSection("dataStory", { sortOrder })}
      >
        <Field label="الشارة" value={value.dataStory.eyebrow} maxLength={200} onChange={(eyebrow) => setSection("dataStory", { eyebrow })} />
        <Field label="العنوان" value={value.dataStory.heading} maxLength={200} onChange={(heading) => setSection("dataStory", { heading })} />
        <Field label="الوصف" value={value.dataStory.description} maxLength={1000} multiline rows={3} onChange={(description) => setSection("dataStory", { description })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="النص البديل للصورة" value={value.dataStory.imageAlt} maxLength={300} onChange={(imageAlt) => setSection("dataStory", { imageAlt })} />
          <Field label="الملاحظة على الصورة" value={value.dataStory.note} maxLength={300} onChange={(note) => setSection("dataStory", { note })} />
        </div>
      </SectionShell>

      <SectionShell
        title="التعلّم بالتطبيق"
        description="محتوى قسم التطبيق العملي وخطواته."
        enabled={value.build.enabled}
        sortOrder={value.build.sortOrder}
        onToggle={(enabled) => setSection("build", { enabled })}
        onSortOrder={(sortOrder) => setSection("build", { sortOrder })}
      >
        <Field label="الشارة" value={value.build.eyebrow} maxLength={200} onChange={(eyebrow) => setSection("build", { eyebrow })} />
        <Field label="العنوان" value={value.build.heading} maxLength={200} onChange={(heading) => setSection("build", { heading })} />
        <Field label="الوصف" value={value.build.description} maxLength={1000} multiline rows={3} onChange={(description) => setSection("build", { description })} />
        <Field label="النص البديل للصورة" value={value.build.imageAlt} maxLength={300} onChange={(imageAlt) => setSection("build", { imageAlt })} />
        <ListEditor
          items={value.build.steps.map((label) => ({ label }))}
          maxItems={8}
          addLabel="إضافة خطوة"
          createItem={() => ({ label: "" })}
          onChange={(items) => setSection("build", { steps: items.map((item) => item.label) })}
          renderItem={(item, update) => <Field label="الخطوة" value={item.label} maxLength={120} onChange={(label) => update({ label })} />}
        />
      </SectionShell>

      {/* ABOUT */}
      <SectionShell
        title="عن الأكاديمية"
        description="قسم التعريف بالمنصة وقيمتها التعليمية."
        enabled={value.about.enabled}
        sortOrder={value.about.sortOrder}
        onToggle={(enabled) => setSection("about", { enabled })}
        onSortOrder={(sortOrder) => setSection("about", { sortOrder })}
      >
        <Field
          label="العنوان"
          value={value.about.heading}
          maxLength={200}
          onChange={(heading) => setSection("about", { heading })}
        />
        <Field
          label="الوصف"
          value={value.about.description}
          maxLength={2000}
          multiline
          rows={4}
          onChange={(description) => setSection("about", { description })}
        />
        <ImageUploadField
          label="صورة قسم عن الأكاديمية"
          value={value.about.imageUrl}
          onChange={(imageUrl) => setSection("about", { imageUrl })}
          hint="إذا لم تُحدد صورة هنا فستُستخدم صورة الابتكار من صور الصفحة الرئيسية."
        />
      </SectionShell>

      {/* FEATURES */}
      <SectionShell
        title="المنهجية والمزايا"
        description="بطاقات المزايا التعليمية المعروضة في الصفحة الرئيسية."
        enabled={value.features.enabled}
        sortOrder={value.features.sortOrder}
        onToggle={(enabled) => setSection("features", { enabled })}
        onSortOrder={(sortOrder) => setSection("features", { sortOrder })}
      >
        <Field
          label="العنوان"
          value={value.features.heading}
          maxLength={200}
          onChange={(heading) => setSection("features", { heading })}
        />
        <Field
          label="الوصف"
          value={value.features.description}
          maxLength={600}
          multiline
          rows={2}
          onChange={(description) => setSection("features", { description })}
        />
        <ListEditor
          items={value.features.items}
          maxItems={8}
          addLabel="إضافة ميزة"
          createItem={() => ({ title: "", description: "" })}
          onChange={(items) => setSection("features", { items })}
          renderItem={(item, update) => (
            <div className="space-y-3">
              <Field
                label="عنوان الميزة"
                value={item.title}
                maxLength={120}
                onChange={(v) => update({ title: v })}
              />
              <Field
                label="وصف الميزة"
                value={item.description}
                maxLength={600}
                multiline
                rows={2}
                onChange={(v) => update({ description: v })}
              />
            </div>
          )}
        />
      </SectionShell>

      {/* TESTIMONIALS */}
      <SectionShell
        title="آراء الطلاب"
        description="شهادات وتجارب الخريجين المعروضة في الصفحة الرئيسية."
        enabled={value.testimonials.enabled}
        sortOrder={value.testimonials.sortOrder}
        onToggle={(enabled) => setSection("testimonials", { enabled })}
        onSortOrder={(sortOrder) => setSection("testimonials", { sortOrder })}
      >
        <Field
          label="العنوان"
          value={value.testimonials.heading}
          maxLength={200}
          onChange={(heading) => setSection("testimonials", { heading })}
        />
        <ListEditor
          items={value.testimonials.items}
          maxItems={12}
          addLabel="إضافة رأي طالب"
          createItem={() => ({ quote: "", author: "", role: "", badge: "" })}
          onChange={(items) => setSection("testimonials", { items })}
          renderItem={(item, update) => (
            <div className="space-y-3">
              <Field
                label="نص الرأي"
                value={item.quote}
                maxLength={800}
                multiline
                rows={3}
                onChange={(v) => update({ quote: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field
                  label="الاسم"
                  value={item.author}
                  maxLength={120}
                  onChange={(v) => update({ author: v })}
                />
                <Field
                  label="المسمى الوظيفي"
                  value={item.role}
                  maxLength={120}
                  onChange={(v) => update({ role: v })}
                />
                <Field
                  label="الشارة"
                  value={item.badge}
                  maxLength={120}
                  onChange={(v) => update({ badge: v })}
                />
              </div>
            </div>
          )}
        />
      </SectionShell>

      {/* CTA */}
      <SectionShell
        title="شريط الدعوة للانضمام (CTA)"
        description="الشريط التحفيزي أسفل الصفحة الرئيسية."
        enabled={value.cta.enabled}
        sortOrder={value.cta.sortOrder}
        onToggle={(enabled) => setSection("cta", { enabled })}
        onSortOrder={(sortOrder) => setSection("cta", { sortOrder })}
      >
        <Field
          label="العنوان"
          value={value.cta.heading}
          maxLength={200}
          onChange={(heading) => setSection("cta", { heading })}
        />
        <Field
          label="الوصف"
          value={value.cta.description}
          maxLength={600}
          multiline
          rows={2}
          onChange={(description) => setSection("cta", { description })}
        />
        <Field
          label="نص الزر"
          value={value.cta.buttonText}
          maxLength={80}
          onChange={(buttonText) => setSection("cta", { buttonText })}
        />
      </SectionShell>

      {/* FOOTER */}
      <SectionShell
        title="تذييل الصفحة (Footer)"
        description="إظهار أو إخفاء تذييل الصفحة. النصوص تُدار من تبويب «نصوص الموقع»."
        enabled={value.footer.enabled}
        sortOrder={value.footer.sortOrder}
        showOrder={false}
        onToggle={(enabled) => setSection("footer", { enabled })}
        onSortOrder={(sortOrder) => setSection("footer", { sortOrder })}
      >
        <p className="text-[11px] text-slate-500">
          يتم التحكم في نص التذييل وشعار التذييل من تبويبي «نصوص الموقع» و«الشعارات».
        </p>
      </SectionShell>
    </div>
  );
}
