"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage, type Locale } from "@/components/providers/language-provider";

type TranslationRecord = {
  original: string;
  appliedLocale?: Locale;
  translatedText?: string;
  pendingLocale?: Locale;
};

type TranslationTask = {
  record: TranslationRecord;
  original: string;
  apply: (translation: string) => void;
};

const translatedTextCache = new Map<string, string>();
const ARABIC_CHARACTERS = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "placeholder", "title"];
const MAX_CACHE_ENTRIES = 5_000;

function isTranslatableText(value: string) {
  const text = value.trim();
  return text.length > 1 && text.length <= 8_000 && /[\p{L}]/u.test(text);
}

function getSourceLocale(text: string): Locale {
  return ARABIC_CHARACTERS.test(text) ? "ar" : "en";
}

function shouldSkipElement(element: Element | null, skipFormControls = false) {
  const nonTranslatableElements =
    'script,style,svg,code,pre,kbd,samp,[translate="no"],[data-no-translate],.notranslate,.font-mono,time';
  return Boolean(
    element?.closest(
      skipFormControls
        ? `${nonTranslatableElements},textarea,input,select,option`
        : nonTranslatableElements,
    ),
  );
}

function cacheTranslation(key: string, value: string) {
  translatedTextCache.set(key, value);
  if (translatedTextCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = translatedTextCache.keys().next().value;
    if (oldestKey) translatedTextCache.delete(oldestKey);
  }
}

export function AutoTranslate() {
  const { locale } = useLanguage();
  const textRecords = useRef(new WeakMap<Text, TranslationRecord>());
  const attributeRecords = useRef(new WeakMap<Element, Map<string, TranslationRecord>>());
  const [translationError, setTranslationError] = useState(false);

  useEffect(() => {
    setTranslationError(false);
    let active = true;
    let scanTimer: number | undefined;
    let drainingQueue = false;
    let translationFailed = false;
    const controller = new AbortController();
    const queues: Record<Locale, TranslationTask[]> = { ar: [], en: [] };
    const observer = new MutationObserver(() => scheduleScan());

    function queueTranslation(record: TranslationRecord, sourceText: string, apply: TranslationTask["apply"]) {
      const originalText = sourceText.trim();
      const leadingWhitespace = sourceText.slice(0, sourceText.indexOf(originalText));
      const trailingWhitespace = sourceText.slice(sourceText.indexOf(originalText) + originalText.length);
      const source = getSourceLocale(originalText);
      if (source === locale) {
        record.pendingLocale = undefined;
        if (record.translatedText && record.appliedLocale && record.appliedLocale !== locale) {
          apply(record.original);
          record.translatedText = undefined;
          record.appliedLocale = undefined;
        }
        return;
      }

      const cacheKey = `${locale}\u0000${originalText}`;
      const cached = translatedTextCache.get(cacheKey);
      if (cached !== undefined) {
        const formattedTranslation = `${leadingWhitespace}${cached}${trailingWhitespace}`;
        apply(formattedTranslation);
        record.translatedText = formattedTranslation;
        record.appliedLocale = locale;
        record.pendingLocale = undefined;
        return;
      }
      if (record.pendingLocale === locale || record.appliedLocale === locale) return;

      record.pendingLocale = locale;
      queues[source].push({
        record,
        original: originalText,
        apply: (translation) => {
          if (!active || record.pendingLocale !== locale) return;
          const normalizedTranslation = translation.trim();
          const formattedTranslation =
            `${leadingWhitespace}${normalizedTranslation}${trailingWhitespace}`;
          apply(formattedTranslation);
          record.translatedText = formattedTranslation;
          record.appliedLocale = locale;
          record.pendingLocale = undefined;
          cacheTranslation(cacheKey, normalizedTranslation);
        },
      });
    }

    async function drainQueue() {
      if (drainingQueue || !active || translationFailed) return;
      drainingQueue = true;
      try {
        while (active && (queues.ar.length > 0 || queues.en.length > 0)) {
          const source: Locale = queues.ar.length > 0 ? "ar" : "en";
          const batch = queues[source].splice(0, 16);
          if (batch.length === 0) continue;

          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: batch.map((task) => task.original),
              source,
              target: locale,
            }),
            signal: controller.signal,
          });
          if (!response.ok) {
            const result = await response.json().catch(() => null);
            throw new Error(result?.error || `Translation request failed (${response.status}).`);
          }

          const result: unknown = await response.json();
          if (
            typeof result !== "object"
            || result === null
            || !("translations" in result)
            || !Array.isArray(result.translations)
          ) {
            throw new Error("The local translation service returned an invalid response.");
          }

          const translations: unknown[] = result.translations;
          if (
            translations.length !== batch.length
            || !translations.every((translation) => typeof translation === "string" && translation.trim())
          ) {
            throw new Error("The local translation service returned an invalid response.");
          }

          batch.forEach((task, index) => {
            const translation = translations[index];
            if (typeof translation !== "string") {
              throw new Error("The local translation service returned an invalid response.");
            }
            task.apply(translation);
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          translationFailed = true;
          console.error("Page translation failed.", error);
          setTranslationError(true);
          for (const queue of Object.values(queues)) {
            queue.forEach((task) => {
              task.record.pendingLocale = undefined;
            });
            queue.length = 0;
          }
        }
      } finally {
        drainingQueue = false;
      }
    }

    function scanPage() {
      if (!active) return;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        if (shouldSkipElement(textNode.parentElement, true)) continue;
        const currentText = textNode.nodeValue ?? "";
        let record = textRecords.current.get(textNode);
        if (!record) {
          record = { original: currentText };
          textRecords.current.set(textNode, record);
        } else if (currentText !== record.original && currentText !== record.translatedText) {
          record.original = currentText;
          record.appliedLocale = undefined;
          record.translatedText = undefined;
          record.pendingLocale = undefined;
        }
        if (!isTranslatableText(record.original)) continue;

        queueTranslation(record, record.original, (translation) => {
          textNode.nodeValue = translation;
        });
      }

      const elements = document.body.querySelectorAll("[aria-label],[placeholder],[title]");
      for (const element of elements) {
        if (shouldSkipElement(element)) continue;
        let records = attributeRecords.current.get(element);
        if (!records) {
          records = new Map();
          attributeRecords.current.set(element, records);
        }

        for (const attribute of TRANSLATABLE_ATTRIBUTES) {
          const currentText = element.getAttribute(attribute);
          if (!currentText) continue;
          let record = records.get(attribute);
          if (!record) {
            record = { original: currentText };
            records.set(attribute, record);
          } else if (currentText !== record.original && currentText !== record.translatedText) {
            record.original = currentText;
            record.appliedLocale = undefined;
            record.translatedText = undefined;
            record.pendingLocale = undefined;
          }
          if (!isTranslatableText(record.original)) continue;

          queueTranslation(record, record.original, (translation) => {
            element.setAttribute(attribute, translation);
          });
        }
      }

      void drainQueue();
    }

    function scheduleScan() {
      if (scanTimer !== undefined) window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scanPage, 80);
    }

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });
    scanPage();

    return () => {
      active = false;
      controller.abort();
      observer.disconnect();
      if (scanTimer !== undefined) window.clearTimeout(scanTimer);
    };
  }, [locale]);

  if (!translationError) return null;

  return (
    <div className="translation-error" role="alert" translate="no">
      {locale === "ar"
        ? "تعذرت الترجمة المحلية. تأكد من تشغيل محرك الترجمة على المنفذ 5000."
        : "Local translation is unavailable. Make sure the translation engine is running on port 5000."}
    </div>
  );
}
