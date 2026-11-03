import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PRAY_MAX, prayAloud } from "../systems/network/NetworkManager";
import { useRemote } from "../store/remote";
import { useUi } from "../store/ui";
import { usePlayer } from "../store/player";
import { formatDate, useNotes } from "../store/notes";
import { renderNoteImage, saveImage } from "./noteImage";

/** 기도 메모장: 기도하는 동안 열림. 자동 저장, 날짜별 목록, 삭제, 메모장 모양 이미지로 저장 */
const touchScreen =
  typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches;

export function PrayerNote() {
  const { notes, currentId, saveFailed, openToday, select, update, remove } =
    useNotes();
  const endPrayer = usePlayer((s) => s.endPrayer);
  const [view, setView] = useState<"edit" | "list">("edit");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const online = useRemote((s) => s.status === "online");
  const [aloud, setAloud] = useState<string | null>(null); // 나누기 전 확인 중인 문장
  const [sentAt, setSentAt] = useState(0);
  useEffect(() => {
    if (!sentAt) return;
    const t = window.setTimeout(() => setSentAt(0), 4000);
    return () => clearTimeout(t);
  }, [sentAt]);

  // 모바일: 화면 키보드가 올라와도 메모장이 키보드 위에 보이게 (보이는 화면 높이에 맞춤)
  useEffect(() => {
    const vv = window.visualViewport;
    const el = sheetRef.current;
    if (!vv || !el) return;
    const fit = () => {
      if (window.innerWidth > 640) {
        el.style.bottom = "";
        el.style.maxHeight = "";
        return;
      }
      const covered = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      el.style.bottom = `${covered}px`;
      el.style.maxHeight = `${Math.min(vv.height * 0.75, vv.height - 8)}px`;
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, []);

  useEffect(() => {
    openToday();
  }, [openToday]);

  useEffect(() => {
    // 터치 화면에서는 키보드가 갑자기 올라오지 않게 자동 포커스 안 함
    if (view === "edit" && !matchMedia("(pointer: coarse)").matches)
      textRef.current?.focus({ preventScroll: true });
  }, [view, currentId]);

  // '소리내어 기도하기': 선택한 문장, 없으면 마지막으로 쓴 줄을 나눌 후보로
  const startAloud = () => {
    const ta = textRef.current;
    const sel = ta
      ? ta.value.slice(ta.selectionStart, ta.selectionEnd).trim()
      : "";
    const lastLine =
      (current?.text ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .pop() ?? "";
    setAloud((sel || lastLine).slice(0, PRAY_MAX));
  };

  const current = notes.find((n) => n.id === currentId);
  const saved = notes
    .filter((n) => n.text.trim())
    .sort((a, b) => (a.id < b.id ? 1 : -1));

  // 이미지로 저장: 먼저 미리보기를 보여 주고, [저장하기]를 누르면 저장 (휴대폰은 공유 시트 → 사진에 저장)
  const [shot, setShot] = useState<{
    blob: Blob;
    url: string;
    name: string;
  } | null>(null);
  const [making, setMaking] = useState(false);
  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot.url);
    },
    [shot],
  );
  // 미리보기가 열려 있으면 Esc 는 미리보기만 닫음 (노트·기도는 그대로)
  useEffect(() => {
    if (!shot) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      e.stopImmediatePropagation()
      setShot(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [shot])
  const exportImage = async () => {
    if (!current || making) return;
    setMaking(true);
    try {
      const blob = await renderNoteImage(current.id, current.text);
      setShot({
        blob,
        url: URL.createObjectURL(blob),
        name: `기도노트_${current.id}.png`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setMaking(false);
    }
  };
  const removeCurrent = () => {
    if (!current) return;
    if (
      current.text.trim() &&
      !confirm(`${formatDate(current.id)} 기록을 삭제할까요?`)
    )
      return;
    remove(current.id);
    openToday();
  };

  return (
    <aside className="prayer-note" aria-label="기도 메모" ref={sheetRef}>
      {view === "edit" && current ? (
        <>
          <header>
            <h2>{formatDate(current.id)}</h2>
            <span className="note-head-actions">
              <button className="link" onClick={() => setView("list")}>
                지난 기록
              </button>
              <button
                className="note-close"
                onClick={() => useUi.getState().setNoteOpen(false)}
                aria-label="기도노트 닫기"
              >
                ×
              </button>
            </span>
          </header>
          <textarea
            ref={textRef}
            value={current.text}
            placeholder="오늘의 기도제목을 적어 보세요."
            onChange={(e) => update(current.id, e.target.value)}
          />
          {aloud !== null && (
            <div className="aloud-confirm">
              <p>이 문장이 함께 있는 분들의 화면에 잠시 보입니다.</p>
              <input
                value={aloud}
                maxLength={PRAY_MAX}
                onChange={(e) => setAloud(e.target.value)}
                placeholder="함께 나눌 기도제목"
              />
              <div className="aloud-actions">
                <button onClick={() => setAloud(null)}>취소</button>
                <button
                  className="primary"
                  disabled={!aloud.trim()}
                  onClick={() => {
                    prayAloud(aloud);
                    setAloud(null);
                    setSentAt(Date.now());
                  }}
                >
                  나누기
                </button>
              </div>
            </div>
          )}
          {sentAt > 0 && (
            <p className="aloud-sent">함께 있는 분들에게 전했어요.</p>
          )}
          <div className="note-actions">
            {online && (
              <button
                className="aloud"
                onClick={startAloud}
                disabled={!current.text.trim() || aloud !== null}
              >
                소리내어 기도하기
              </button>
            )}
            <button
              onClick={exportImage}
              disabled={!current.text.trim() || making}
            >
              {making ? "만드는 중…" : "이미지로 저장"}
            </button>
            <button onClick={removeCurrent} disabled={!current.text.trim()}>
              삭제
            </button>
            <button className="primary" onClick={endPrayer}>
              기도 마치기
            </button>
          </div>
        </>
      ) : (
        <>
          <header>
            <h2>지난 기록</h2>
            <button
              className="link"
              onClick={() => {
                openToday();
                setView("edit");
              }}
            >
              오늘 기록
            </button>
          </header>
          <ul className="note-list">
            {saved.length === 0 && (
              <li className="empty">아직 남긴 기록이 없습니다.</li>
            )}
            {saved.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    select(n.id);
                    setView("edit");
                  }}
                >
                  <strong>{formatDate(n.id)}</strong>
                  <span>{n.text.trim().split("\n")[0]}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="note-actions">
            <button className="primary" onClick={endPrayer}>
              기도 마치기
            </button>
          </div>
        </>
      )}
      {shot &&
        createPortal(
          <div
            className="note-shot"
            role="dialog"
            aria-label="기도노트 이미지 미리보기"
            onClick={() => setShot(null)}
          >
            <div
              className="note-shot-card"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={shot.url} alt="기도노트 이미지" />
              {touchScreen && (
                <p>이미지를 길게 눌러 사진에 저장할 수도 있어요.</p>
              )}
              <div className="aloud-actions">
                <button onClick={() => setShot(null)}>닫기</button>
                <button
                  className="primary"
                  onClick={() => void saveImage(shot.blob, shot.name)}
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <p className="note-privacy">
        이 기록은 이 브라우저에만 저장됩니다.
        {online && " (소리내어 기도한 문장만 함께 있는 분들에게 보여요)"}
        {saveFailed && " (지금은 브라우저 설정 때문에 저장되지 않고 있어요)"}
      </p>
    </aside>
  );
}
