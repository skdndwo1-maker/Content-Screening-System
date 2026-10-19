"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { nextLexTag, seedPayload } from "@/lib/lexiconSeed";
import type { LexCategory } from "@/lib/types";

const TABS: { k: LexCategory; ko: string; en: string; desc: string }[] = [
  { k: "terms", ko: "단어 사전", en: "TERMS", desc: "검수 대상 키워드 모음" },
  { k: "rules", ko: "판정 규칙", en: "RULES", desc: "단어 조합·문맥·정규식·이미지 요소 규칙" },
  { k: "sources", ko: "소스 연동", en: "SOURCES", desc: "추론·검색 파이프라인 (Naver 최소 10년)" },
];

const initialDrafts = (): Record<LexCategory, string> => ({
  terms: seedPayload("terms"),
  rules: seedPayload("rules"),
  sources: seedPayload("sources"),
});

export function LexiconModal() {
  const {
    lexiconOpen,
    closeLexicon,
    lexTab,
    setLexTab,
    versions,
    selected,
    deleteLexVersion,
    overwriteLexVersion,
    saveLexVersion,
    applyLexVersion,
  } = useStore();
  const [drafts, setDrafts] = useState<Record<LexCategory, string>>(initialDrafts);
  const [previewByTab, setPreviewByTab] = useState<Partial<Record<LexCategory, string>>>({});
  const [commitMsg, setCommitMsg] = useState("");
  const [versionTag, setVersionTag] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<null | "overwrite" | "newVersion" | "delete">(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState<string | null>(null);

  const list = versions[lexTab];
  const current = useMemo(() => list.find(v => v.tag === selected[lexTab]), [list, selected, lexTab]);
  const draft = drafts[lexTab];
  const preview = previewByTab[lexTab] ?? selected[lexTab];
  const error = useMemo(() => {
    try {
      JSON.parse(draft);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "JSON 파싱 오류";
    }
  }, [draft]);

  const setDraft = (v: string) => setDrafts(d => ({ ...d, [lexTab]: v }));
  const setPreview = (tag: string) => setPreviewByTab(p => ({ ...p, [lexTab]: tag }));

  const loadVersion = (tag: string) => {
    const found = list.find(v => v.tag === tag);
    setPreview(tag);
    if (found?.payload) setDraft(found.payload);
  };

  const resetConfirm = () => {
    setConfirmKind(null);
    setCommitMsg("");
    setVersionTag("");
    setSaveError(null);
    setPendingDeleteTag(null);
  };

  const appliedTag = selected[lexTab];
  useEffect(() => {
    if (!lexiconOpen) return;
    const applied = useStore.getState().versions[lexTab].find(v => v.tag === appliedTag);
    if (applied?.payload) {
      setDrafts(d => ({ ...d, [lexTab]: applied.payload as string }));
    }
    setPreviewByTab(p => ({ ...p, [lexTab]: appliedTag }));
  }, [lexiconOpen, lexTab, appliedTag]);

  if (!lexiconOpen) return null;

  const canConfirmSave = confirmKind === "delete" || Boolean(commitMsg.trim() && (confirmKind !== "newVersion" || versionTag.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-[22px]">
      <div className="relative flex max-h-[86vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-[22px] py-[16px]" style={{ borderColor: "#eee" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "1.5px", color: "var(--accent)" }}>CUSTOM LEXICON</div>
            <div className="mt-[2px]" style={{ fontSize: 15, fontWeight: 800 }}>커스텀 렉시콘 · JSON</div>
          </div>
          <span onClick={closeLexicon} className="cursor-pointer rounded-full px-[10px] py-[4px]" style={{ background: "#f3f3f3", fontSize: 14 }}>
            ✕
          </span>
        </div>

        <div className="flex gap-0 border-b" style={{ borderColor: "#eee" }}>
          {TABS.map(t => {
            const active = lexTab === t.k;
            return (
              <div
                key={t.k}
                onClick={() => setLexTab(t.k)}
                className="flex cursor-pointer flex-col gap-[2px] px-[22px] py-[12px]"
                style={{
                  background: active ? "#fff" : "#fafafa",
                  color: active ? "var(--ink)" : "#888",
                  borderBottom: `2px solid ${active ? "var(--ink)" : "transparent"}`,
                  marginBottom: -1,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800 }}>{t.ko}</div>
                <div style={{ fontSize: 9.5, letterSpacing: "1px", color: "#aaa", fontWeight: 700 }}>{t.en}</div>
              </div>
            );
          })}
        </div>

        <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 300px" }}>
          <div className="flex flex-col overflow-hidden p-[20px]">
            <div className="mb-[10px] flex items-center justify-between gap-[10px]">
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{TABS.find(t => t.k === lexTab)?.desc}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  적용 중 · {current?.tag} · {current?.author} · {current?.at}
                </div>
              </div>
              <div className="flex gap-[6px]">
                <div
                  onClick={() => {
                    if (error) return;
                    setVersionTag(selected[lexTab]);
                    setCommitMsg("");
                    setSaveError(null);
                    setConfirmKind("overwrite");
                  }}
                  className="cursor-pointer rounded-[8px] border bg-white px-[12px] py-[6px]"
                  style={{ borderColor: "#e0e0e0", fontSize: 11.5, fontWeight: 700, color: error ? "#aaa" : "#555", pointerEvents: error ? "none" : "auto" }}
                >
                  덮어쓰기
                </div>
                <div
                  onClick={() => {
                    if (error) return;
                    setVersionTag(nextLexTag(list.map(v => v.tag)));
                    setCommitMsg("");
                    setSaveError(null);
                    setConfirmKind("newVersion");
                  }}
                  className="cursor-pointer rounded-[8px] px-[14px] py-[6px]"
                  style={{ background: error ? "#aaa" : "var(--ink)", color: "#fff", fontSize: 11.5, fontWeight: 700, pointerEvents: error ? "none" : "auto" }}
                >
                  새 버전으로 저장
                </div>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none rounded-[12px] border p-[14px] outline-none"
              style={{
                borderColor: error ? "#a63232" : "#e5e5e5",
                background: "#fafafa",
                fontFamily: "'SFMono-Regular', Consolas, monospace",
                fontSize: 12.5,
                lineHeight: 1.6,
                color: "#1c1c1c",
                minHeight: 260,
              }}
            />
            <div className="mt-[8px]" style={{ fontSize: 11.5, color: error ? "#a63232" : "#3f6b4a" }}>
              {error ? `JSON 오류 · ${error}` : "JSON 유효 · 메모리에 저장됩니다 (새로고침 시 초기화)"}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden border-l" style={{ borderColor: "#eee", background: "#fafafa" }}>
            <div className="flex items-center justify-between border-b p-[14px]" style={{ borderColor: "#eee" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>VERSIONS</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>카테고리별 독립 관리 · RAM</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
              {list.map((v, i) => {
                const isLatest = i === 0;
                const isActive = selected[lexTab] === v.tag;
                const isPreview = preview === v.tag;
                return (
                  <div
                    key={v.tag}
                    onClick={() => loadVersion(v.tag)}
                    className="cursor-pointer border-b p-[12px]"
                    style={{ borderColor: "#f0f0f0", background: isPreview ? "#fff" : "transparent" }}
                  >
                    <div className="flex items-center gap-[6px]">
                      <span style={{ fontSize: 12.5, fontWeight: 800 }}>{v.tag}</span>
                      {isLatest && <span className="rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 9.5, fontWeight: 700, background: "#eef7ef", color: "#3f6b4a" }}>LATEST</span>}
                      {isActive && <span className="rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 9.5, fontWeight: 700, background: "var(--ink)", color: "#fff" }}>적용 중</span>}
                      {isPreview && !isActive && <span className="rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 9.5, fontWeight: 700, background: "#f3f3f3", color: "#555" }}>선택됨</span>}
                    </div>
                    <div className="mt-[4px]" style={{ fontSize: 11.5, color: "#333", lineHeight: 1.5 }}>
                      {v.message}
                    </div>
                    <div className="mt-[4px]" style={{ fontSize: 10, color: "#999" }}>
                      {v.author} · {v.at}
                    </div>
                    <div className="mt-[8px] flex gap-[6px]">
                      {!isActive && isPreview && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            applyLexVersion(lexTab, v.tag);
                            if (v.payload) setDraft(v.payload);
                            setPreview(v.tag);
                          }}
                          className="flex-1 cursor-pointer rounded-[6px] px-[10px] py-[5px] text-center"
                          style={{ background: "var(--ink)", color: "#fff", fontSize: 10.5, fontWeight: 700 }}
                        >
                          이 버전 적용
                        </div>
                      )}
                      {!isActive && list.length > 1 && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setPendingDeleteTag(v.tag);
                            setConfirmKind("delete");
                          }}
                          className="cursor-pointer rounded-[6px] border bg-white px-[10px] py-[5px] text-center"
                          style={{ borderColor: "#f1dcdc", color: "#a63232", fontSize: 10.5, fontWeight: 700 }}
                        >
                          삭제
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {confirmKind && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-[22px]">
            <div className="w-full max-w-[420px] rounded-[20px] bg-white p-[22px] shadow-xl">
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {confirmKind === "overwrite"
                  ? `${selected[lexTab]} 버전을 덮어쓸까요?`
                  : confirmKind === "delete"
                    ? `${pendingDeleteTag} 버전을 삭제할까요?`
                    : "새 버전으로 저장할까요?"}
              </div>
              <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6 }}>
                {confirmKind === "delete"
                  ? "삭제된 버전은 목록에서 사라집니다. 적용 중인 버전과 마지막 남은 버전은 삭제할 수 없습니다."
                  : "지금은 브라우저 메모리에만 저장됩니다. 새로고침하면 데모 버전으로 돌아갑니다."}
              </p>
              {confirmKind !== "delete" && (
                <>
                  <label className="mt-[12px] block" style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>버전명</label>
                  <input
                    value={versionTag}
                    onChange={e => {
                      setVersionTag(e.target.value.slice(0, 24));
                      setSaveError(null);
                    }}
                    disabled={confirmKind === "overwrite"}
                    placeholder="예) v15"
                    className="mt-[6px] w-full rounded-[8px] border p-[10px] outline-none"
                    style={{
                      borderColor: "#e5e5e5",
                      background: confirmKind === "overwrite" ? "#f3f3f3" : "#fafafa",
                      fontSize: 12.5,
                      color: confirmKind === "overwrite" ? "#888" : "#111",
                    }}
                  />
                  <label className="mt-[12px] block" style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>변경 설명</label>
                  <input
                    value={commitMsg}
                    onChange={e => setCommitMsg(e.target.value.slice(0, 60))}
                    placeholder="예) 성별 혐오 신규 파생어 반영"
                    className="mt-[6px] w-full rounded-[8px] border p-[10px] outline-none"
                    style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 12.5 }}
                  />
                  <div className="mt-[6px] flex justify-between" style={{ fontSize: 10.5, color: saveError ? "#a63232" : "#999" }}>
                    <span>{saveError || `${commitMsg.length} / 60`}</span>
                    <span>{confirmKind === "overwrite" ? "현재 적용 버전 JSON을 교체" : "목록 맨 위에 추가되고 적용됩니다"}</span>
                  </div>
                </>
              )}
              <div className="mt-[14px] flex justify-end gap-[8px]">
                <div
                  onClick={resetConfirm}
                  className="cursor-pointer rounded-[8px] border bg-white px-[14px] py-[7px]"
                  style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#555" }}
                >
                  취소
                </div>
                <div
                  onClick={() => {
                    if (confirmKind === "delete") {
                      if (pendingDeleteTag) {
                        const ok = deleteLexVersion(lexTab, pendingDeleteTag);
                        if (ok && preview === pendingDeleteTag) {
                          loadVersion(selected[lexTab]);
                        }
                      }
                      resetConfirm();
                      return;
                    }
                    if (!commitMsg.trim()) return;
                    if (confirmKind === "overwrite") {
                      overwriteLexVersion(lexTab, commitMsg, draft);
                      resetConfirm();
                      return;
                    }
                    const created = saveLexVersion(lexTab, versionTag, commitMsg, draft);
                    if (!created) {
                      setSaveError("이미 있는 버전명이거나 이름이 비어 있습니다.");
                      return;
                    }
                    setPreview(created);
                    resetConfirm();
                  }}
                  className="cursor-pointer rounded-[8px] px-[14px] py-[7px]"
                  style={{
                    background:
                      confirmKind === "delete"
                        ? "#a63232"
                        : canConfirmSave
                          ? "var(--ink)"
                          : "#aaa",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    pointerEvents: confirmKind !== "delete" && !canConfirmSave ? "none" : "auto",
                  }}
                >
                  {confirmKind === "overwrite" ? "덮어쓰기" : confirmKind === "delete" ? "삭제" : "저장"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
