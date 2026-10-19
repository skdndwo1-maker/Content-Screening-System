"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { itemAppliesToTab } from "@/lib/taxonomy";
import type { UploadTab } from "@/lib/types";

const TABS: { k: UploadTab; ko: string; en: string; icon: React.ReactNode }[] = [
  { k: "image", ko: "이미지·디자인", en: "IMAGE", icon: <span style={{ fontSize: 12 }}>🖼</span> },
  {
    k: "naming",
    ko: "카피·네이밍",
    en: "COPY & NAMING",
    icon: (
      <span className="inline-flex flex-col items-start" style={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>
        <span style={{ fontSize: 9 }}>A</span>
        <span style={{ fontSize: 10, marginTop: -1 }}>가</span>
      </span>
    ),
  },
  { k: "text", ko: "텍스트", en: "TEXT", icon: <span style={{ fontSize: 14, fontWeight: 800 }}>T</span> },
];

const CONTENT_TYPES = ["광고 · 프로모션", "브랜드 · 캠페인", "제품 · 서비스 소개", "이벤트", "공지 · 안내", "기타"];
const TARGETS = ["10대", "20대", "30대", "40대", "50대 이상", "전 연령"];

export function UploadScreen() {
  const s = useStore();
  const ctxIncomplete = !s.ctxName.trim() || !s.ctxDate || s.ctxChannels.length === 0;

  useEffect(() => {
    if (!TABS.some(t => t.k === s.uploadTab)) s.setUploadTab("image");
  }, [s.uploadTab, s.setUploadTab]);

  return (
    <div className="cg-rise mx-auto px-[34px] pt-[30px] pb-[48px]" style={{ maxWidth: 1120 }}>
      <div className="mb-[20px]">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--accent)" }}>STEP 01 — UPLOAD</div>
        <h1 className="mt-[8px]" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1 }}>
          검수할 콘텐츠를 등록해 주세요
        </h1>
        {s.rescanMode && (
          <div className="mt-[9px] flex items-center gap-[9px]">
            <span
              className="rounded-[8px] px-[9px] py-[3px]"
              style={{ fontSize: 11, fontWeight: 700, background: "#f4f0e8", color: "#8a7340" }}
            >
              재검수 · v{s.chainVersion}
            </span>
            <span style={{ fontSize: 12, color: "#777" }}>
              이전 {s.prevSummary?.version} · {s.prevSummary?.grade} {s.prevSummary?.score}점 기준으로 재검수
            </span>
          </div>
        )}
        <p className="mt-[10px]" style={{ fontSize: 14, color: "#666", maxWidth: 560 }}>
          검수할 브랜드 콘텐츠를 입력하세요. 택소노미와 컴플라이언스 RAG를 Gemini에 넣어 판정합니다.
        </p>
      </div>

      <div className="flex gap-0 border-b-2" style={{ borderColor: "var(--ink)" }}>
        {TABS.map(t => {
          const active = s.uploadTab === t.k;
          return (
            <div
              key={t.k}
              onClick={() => s.setUploadTab(t.k)}
              className="flex cursor-pointer items-center gap-[8px] px-[18px] py-[11px]"
              style={{
                background: active ? "var(--ink)" : "transparent",
                color: active ? "#fff" : "#666",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
              }}
            >
              {t.icon}
              <span>{t.ko}</span>
              <span style={{ fontSize: 9, letterSpacing: "1px", opacity: 0.6, fontWeight: 700 }}>{t.en}</span>
            </div>
          );
        })}
      </div>

      <div
        className="mt-[20px] grid gap-[24px]"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px", alignItems: "start" }}
      >
        <div className="flex min-w-0 flex-col gap-[16px]">
          <div className="rounded-[20px] border bg-white" style={{ borderColor: "#e5e5e5" }}>
            {s.uploadTab === "naming" && <NamingTab />}
            {s.uploadTab === "text" && <TextTab />}
            {s.uploadTab === "image" && <ImageTab />}
          </div>

          <ContextCard />
        </div>

        <div className="flex flex-col gap-[14px]" style={{ position: "sticky", top: 76 }}>
          <CriteriaPanel />

          <div
            onClick={() => !ctxIncomplete && s.startAnalysis()}
            className="cg-neon-hover flex cursor-pointer items-center justify-center gap-[10px] rounded-[20px]"
            style={{
              background: ctxIncomplete ? "#aaa" : "#000",
              color: "#fff",
              padding: "16px 20px",
              opacity: ctxIncomplete ? 0.6 : 1,
              pointerEvents: ctxIncomplete ? "none" : "auto",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.2px" }}>검수 시작</div>
            <span style={{ fontSize: 16 }}>→</span>
          </div>
          {ctxIncomplete && (
            <div style={{ fontSize: 11, color: "#a63232", textAlign: "center", marginTop: -8 }}>
              검수 맥락의 캠페인명 · 게시 예정일 · 게시 채널을 입력해 주세요.
            </div>
          )}
          <div style={{ fontSize: 11, color: "#999", textAlign: "center", lineHeight: 1.5 }}>
            RAG 규정 근거 + Gemini 판정 · 미연동 소스는 건너뜀
          </div>
        </div>
      </div>
    </div>
  );
}

function NamingTab() {
  const { namingRows, updateNaming, addNaming, removeNaming } = useStore();
  return (
    <div className="p-[18px]">
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        네이밍 / 카피 후보 <span style={{ color: "#aaa", fontWeight: 500 }}>Naming</span>
      </div>
      <p className="mb-[12px]" style={{ fontSize: 12, color: "#888" }}>
        상품명 · 캠페인명 · 슬로건 후보를 한 줄씩 입력하세요.
      </p>
      <div className="flex flex-col gap-[8px]">
        {namingRows.map((row, i) => (
          <div key={i} className="flex items-center gap-[8px]">
            <input
              value={row}
              onChange={e => updateNaming(i, e.target.value)}
              placeholder="Ex) 우리 동네 데이터 요금제"
              className="min-w-0 flex-1 rounded-[12px] border p-[12px] outline-none"
              style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 14 }}
            />
            {namingRows.length > 1 && (
              <span
                onClick={() => removeNaming(i)}
                className="cursor-pointer px-[4px]"
                style={{ fontSize: 16, color: "#bbb" }}
              >
                ×
              </span>
            )}
          </div>
        ))}
        <div
          onClick={addNaming}
          className="cursor-pointer rounded-[12px] border border-dashed p-[12px] text-center"
          style={{ borderColor: "#cfcfcf", fontSize: 13, color: "#aaa" }}
        >
          + 후보 추가
        </div>
      </div>
    </div>
  );
}

function TextTab() {
  const { textValue, setTextValue, rescanMode, prevSummary } = useStore();
  return (
    <div className="p-[18px]">
      <div className="mb-[8px] flex items-center justify-between gap-[12px]">
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          카피 / 텍스트 입력 <span style={{ color: "#aaa", fontWeight: 500 }}>Copy &amp; Text</span>
        </div>
        <label
          className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border px-[12px] py-[6px] whitespace-nowrap hover:bg-[var(--ink)] hover:text-white"
          style={{ borderColor: "var(--ink)", color: "var(--ink)", fontSize: 11.5, fontWeight: 700 }}
        >
          <span style={{ fontSize: 12 }}>⬆</span> 파일 불러오기
          <input type="file" accept=".docx,.txt,.hwp,.pdf,image/*" className="hidden" />
        </label>
      </div>

      {rescanMode && (
        <div className="mb-[10px] rounded-[20px] border p-[12px]" style={{ borderColor: "#eee", background: "#fafafa" }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>이전 버전 원문 ({prevSummary?.version})</span>
            <span className="cursor-pointer rounded-[8px] border bg-white px-[11px] py-[5px]" style={{ borderColor: "#ddd", fontSize: 11, color: "#555" }}>
              이전 원문 불러오기
            </span>
          </div>
          <div className="mt-[7px]" style={{ fontSize: 12, color: "#999", lineHeight: 1.55 }}>
            이거 모르면 한남충 인증
          </div>
        </div>
      )}

      <textarea
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        placeholder="Ex) 이번 여름, 가족과 함께하는 데이터 걱정 없는 하루"
        className="w-full resize-y rounded-[20px] border p-[12px] outline-none"
        style={{ borderColor: "#e5e5e5", background: "#fafafa", height: 118, maxHeight: 300, fontSize: 14, lineHeight: 1.6 }}
      />
      <div className="mt-[8px] flex justify-between" style={{ fontSize: 11 }}>
        <span style={{ color: "#999" }}>&nbsp;</span>
        <span style={{ color: "#999" }}>{textValue.length} 자</span>
      </div>
    </div>
  );
}

function ImageTab() {
  const { files, addFile, removeFile } = useStore();
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    Array.from(list).forEach(f => {
      const isImage = f.type.startsWith("image/");
      const url = isImage ? URL.createObjectURL(f) : undefined;
      const id = `${f.name}-${f.size}-${Date.now()}`;
      addFile({
        id,
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        isImage,
        ext: f.name.split(".").pop()?.toUpperCase() || "FILE",
        url,
      });
      if (isImage && f.size <= 4 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
          if (!dataUrl) return;
          useStore.setState(st => ({
            files: st.files.map(file => (file.id === id ? { ...file, dataUrl } : file)),
          }));
        };
        reader.readAsDataURL(f);
      }
    });
    e.target.value = "";
  };
  return (
    <div className="p-[18px]">
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
        이미지 / 디자인 시안 <span style={{ color: "#aaa", fontWeight: 500 }}>Image &amp; Design</span>
      </div>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[28px] border-2 border-dashed text-center"
        style={{ borderColor: "#cfcfcf", height: 132, background: "#fafafa" }}
      >
        <div style={{ fontSize: 24 }}>⬆</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>키비주얼 · 배너 · 썸네일을 드래그앤드롭</div>
        <div style={{ fontSize: 12, color: "#999" }}>JPG PNG PDF · 최대 20MB</div>
        <span className="rounded-[8px] px-[18px] py-[8px]" style={{ background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 700 }}>
          파일 선택
        </span>
        <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={onPick} />
      </label>

      {files.length > 0 && (
        <div
          className="mt-[12px] grid gap-[10px]"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}
        >
          {files.map(f => (
            <div key={f.id} className="relative overflow-hidden rounded-[12px] border bg-white" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex h-[96px] items-center justify-center" style={{ background: "#f2f2f2" }}>
                {f.isImage && f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="h-full w-full object-contain" />
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#999", letterSpacing: "0.5px" }}>{f.ext}</span>
                )}
              </div>
              <div className="p-[7px]">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 11.5, fontWeight: 600 }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{f.size}</div>
              </div>
              <span
                onClick={() => removeFile(f.id)}
                className="absolute right-[6px] top-[6px] flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full text-white"
                style={{ background: "rgba(0,0,0,0.6)", fontSize: 13 }}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContextCard() {
  const s = useStore();
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 6, display: "block" };
  return (
    <div className="rounded-[28px] border bg-white p-[20px]" style={{ borderColor: "#e5e5e5" }}>
      <div className="flex items-start justify-between gap-[16px]">
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>검수 맥락 · CONTEXT</div>
          <div className="mt-[6px]" style={{ fontSize: 12.5, color: "#777", lineHeight: 1.5 }}>
            게시 시점·채널·타겟에 따라 위험도 판정 기준이 달라집니다.
          </div>
        </div>
        <label
          className="flex cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-[8px] border px-[14px] py-[8px] hover:bg-[var(--ink)] hover:text-white"
          style={{ borderColor: "var(--ink)", color: "var(--ink)", fontSize: 11.5, fontWeight: 700 }}
        >
          <span style={{ fontSize: 12 }}>⬆</span> 기획서·브리프 불러오기
          <input type="file" accept=".pdf,.docx,.pptx" className="hidden" />
        </label>
      </div>

      <div className="mt-[16px] grid gap-[14px]" style={{ gridTemplateColumns: "1fr 190px" }}>
        <div>
          <label style={labelStyle}>
            프로젝트·캠페인명 <span style={{ color: "var(--accent)" }}>*</span>
          </label>
          <input
            value={s.ctxName}
            onChange={e => s.setCtx({ ctxName: e.target.value })}
            placeholder="Ex) 여름 데이터 프로모션"
            className="w-full rounded-[20px] border p-[12px] outline-none"
            style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 14 }}
          />
        </div>
        <div>
          <label style={labelStyle}>
            게시 예정일 <span style={{ color: "var(--accent)" }}>*</span>
          </label>
          <input
            value={s.ctxDate}
            onChange={e => s.setCtx({ ctxDate: e.target.value })}
            type="date"
            className="w-full rounded-[20px] border p-[12px] outline-none"
            style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 13, height: 44 }}
          />
        </div>
      </div>

      <div className="mt-[12px]">
        <label style={labelStyle}>
          게시 채널 <span style={{ color: "var(--accent)" }}>*</span>
        </label>
        <div
          onClick={() => s.setChannelMenu(!s.channelMenuOpen)}
          className="flex min-h-[44px] cursor-pointer items-center gap-[6px] rounded-[20px] border px-[12px] py-[9px]"
          style={{ borderColor: "#e5e5e5", background: "#fafafa", flexWrap: "wrap" }}
        >
          {s.ctxChannels.length === 0 ? (
            <span style={{ fontSize: 13, color: "#b0b0b0", fontStyle: "italic" }}>채널을 선택하세요</span>
          ) : (
            s.ctxChannels.map(c => (
              <span key={c} className="rounded-[8px] px-[8px] py-[3px]" style={{ fontSize: 11, fontWeight: 600, background: "#f0f0f0", color: "#444" }}>
                {c}
              </span>
            ))
          )}
          <span className="ml-auto" style={{ color: "#999", fontSize: 12 }}>
            {s.channelMenuOpen ? "선택 완료" : "⌄"}
          </span>
        </div>
        {s.channelMenuOpen && (
          <div
            className="mt-[5px] rounded-[20px] border bg-white p-[5px] shadow-lg"
            style={{ borderColor: "#e0e0e0", maxHeight: 220, overflowY: "auto" }}
          >
            {s.channelList.map(c => {
              const on = s.ctxChannels.includes(c);
              return (
                <div
                  key={c}
                  onClick={() => s.toggleCtxChannel(c)}
                  className="flex cursor-pointer items-center gap-[9px] rounded-[8px] px-[9px] py-[7px] hover:bg-[#fafafa]"
                >
                  <span
                    className="flex h-[16px] w-[16px] items-center justify-center rounded-[4px] border"
                    style={{
                      borderColor: on ? "var(--ink)" : "#ddd",
                      background: on ? "var(--ink)" : "#fff",
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 13 }}>{c}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        onClick={() => s.setCtx({ ctxDetailOpen: !s.ctxDetailOpen })}
        className="mt-[16px] flex cursor-pointer items-center gap-[7px] border-t pt-[14px]"
        style={{ borderColor: "#f0f0f0" }}
      >
        <span style={{ display: "inline-block", transform: s.ctxDetailOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>상세 맥락 입력</span>
        <span style={{ fontSize: 11, color: "#aaa" }}>선택</span>
      </div>

      {s.ctxDetailOpen && (
        <div className="mt-[14px] flex flex-col gap-[14px]">
          <div>
            <label style={labelStyle}>주요 타겟</label>
            <div className="flex flex-wrap gap-[6px]">
              {TARGETS.map(t => {
                const on = s.ctxTargets.includes(t);
                return (
                  <span
                    key={t}
                    onClick={() => s.toggleCtxTarget(t)}
                    className="cursor-pointer rounded-[8px] border px-[10px] py-[6px]"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      borderColor: on ? "var(--ink)" : "#e0e0e0",
                      background: on ? "var(--ink)" : "#fff",
                      color: on ? "#fff" : "#555",
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>콘텐츠 유형</label>
            <div className="flex flex-wrap gap-[6px]">
              {CONTENT_TYPES.map(t => {
                const on = s.ctxType === t;
                return (
                  <span
                    key={t}
                    onClick={() => s.setCtx({ ctxType: on ? "" : t })}
                    className="cursor-pointer rounded-[8px] border px-[10px] py-[6px]"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      borderColor: on ? "var(--ink)" : "#e0e0e0",
                      background: on ? "var(--ink)" : "#fff",
                      color: on ? "#fff" : "#555",
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>캠페인 배경·의도</label>
            <textarea
              value={s.ctxIntent}
              onChange={e => s.setCtx({ ctxIntent: e.target.value })}
              placeholder="Ex) 여름 성수기 데이터 사용량 증가에 맞춘 프로모션. 가족 단위 고객의 신규 가입 유도가 목적"
              className="w-full resize-y rounded-[20px] border p-[12px] outline-none"
              style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 13, minHeight: 76, lineHeight: 1.55 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CriteriaPanel() {
  const s = useStore();
  const isAdmin = s.role === "admin";
  const tab = s.uploadTab;

  return (
    <div className="rounded-[28px] border bg-white p-[18px]" style={{ borderColor: "#e5e5e5" }}>
      <div className="mb-[14px] flex items-start justify-between gap-[8px]">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--ink)", marginBottom: 4 }}>REVIEW CRITERIA</div>
          <div style={{ fontSize: 12, color: "#888" }}>검수 기준 · 민감도</div>
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        {s.critDefs.map(g => {
          const items = s.criteria[g.g] || {};
          const applicable = g.items.filter(it => itemAppliesToTab(it, tab));
          const sel = applicable.filter(it => items[it.k]).length;
          const total = applicable.length || g.items.length;
          const allOn = applicable.length > 0 && sel === total;
          const open = !!s.critOpen[g.g];
          return (
            <div key={g.g} className="rounded-[12px] border" style={{ borderColor: "#eee", background: "#fcfcfc" }}>
              <div
                className="flex items-center justify-between px-[12px] py-[10px]"
                style={{ background: open ? "#fff" : "transparent" }}
              >
                <div onClick={() => s.toggleGroupOpen(g.g)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-[7px]">
                  <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
                  <div className="min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{g.ko}</div>
                    <div style={{ fontSize: 8.5, letterSpacing: "0.6px", color: "#aaa", fontWeight: 700, marginTop: 1 }}>{g.en}</div>
                  </div>
                  <span className="ml-[4px] rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 10, fontWeight: 700, background: "#f3f3f3", color: "#666" }}>
                    {sel}/{total}
                  </span>
                </div>
                <div
                  onClick={() => s.toggleGroupAll(g.g)}
                  className="cursor-pointer rounded-[6px] px-[8px] py-[3px]"
                  style={{ fontSize: 10, fontWeight: 700, border: "1px solid #e0e0e0", color: "#666", background: "#fff" }}
                >
                  {allOn ? "전체" : "선택"}
                </div>
              </div>
              {open && (
                <div className="flex flex-col gap-[2px] px-[6px] pt-[4px] pb-[7px]">
                  {g.items.map(c => {
                    const on = !!s.criteria[g.g]?.[c.k];
                    const applicable = itemAppliesToTab(c, tab);
                    return (
                      <div
                        key={c.k}
                        onClick={() => applicable && s.toggleCriterion(g.g, c.k)}
                        className="flex items-start gap-[9px] rounded-[8px] p-[7px] hover:bg-[#fafafa]"
                        style={{ cursor: applicable ? "pointer" : "default", opacity: applicable ? 1 : 0.4 }}
                      >
                        <div
                          className="mt-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-[4px] border text-white"
                          style={{
                            borderColor: on && applicable ? "var(--ink)" : "#ddd",
                            background: on && applicable ? "var(--ink)" : "#fff",
                            fontSize: 10,
                          }}
                        >
                          {on && applicable ? "✓" : ""}
                        </div>
                        <div className="min-w-0 flex-1" style={{ lineHeight: 1.25 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.ko}</div>
                          <div style={{ fontSize: 8.5, letterSpacing: "0.5px", color: "#aaa", fontWeight: 700, marginTop: 1 }}>{c.en}</div>
                          {!applicable && <div style={{ fontSize: 10.5, color: "#aaa", marginTop: 3 }}>이 탭 비대상</div>}
                          {c.desc && <div style={{ fontSize: 11, color: "#888", marginTop: 4, lineHeight: 1.4 }}>{c.desc}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="mt-[14px] cursor-pointer border-t pt-[14px]" style={{ borderColor: "#eee" }} onClick={s.openLexicon}>
          <div
            className="flex items-center justify-between rounded-[8px] border p-[10px] hover:bg-[var(--ink)] hover:text-white"
            style={{ borderColor: "var(--ink)", background: "#fafafa" }}
          >
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                커스텀 렉시콘 <span style={{ fontSize: 10, opacity: 0.6 }}>JSON</span>
              </div>
              <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 2 }}>
                단어 사전 {s.selected.terms} · 규칙 {s.selected.rules} · 소스 {s.selected.sources}
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>⌄</span>
          </div>
        </div>
      )}
    </div>
  );
}
