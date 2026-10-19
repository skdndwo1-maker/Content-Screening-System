function waitFrames(n = 2) {
  return new Promise<void>(resolve => {
    const step = (left: number) => {
      if (left <= 0) return resolve();
      requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

function skipExportChrome(node: HTMLElement) {
  if (node.dataset?.exportHide !== undefined) return false;
  if (typeof node.closest === "function" && node.closest("[data-export-hide]")) return false;
  return true;
}

export async function exportReport(kind: "pdf" | "png" | "jpeg", filename: string) {
  const root = document.getElementById("cg-report");
  if (!root) return;
  document.documentElement.classList.add("cg-printing");
  document.body.classList.add("cg-printing");
  await waitFrames(3);
  try {
    if (kind === "pdf") {
      await new Promise<void>(resolve => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          window.removeEventListener("afterprint", done);
          resolve();
        };
        window.addEventListener("afterprint", done);
        window.print();
        window.setTimeout(done, 2000);
      });
      return;
    }
    const { toPng, toJpeg } = await import("html-to-image");
    const opts = {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      filter: skipExportChrome,
    };
    const dataUrl = kind === "jpeg" ? await toJpeg(root, { ...opts, quality: 0.92 }) : await toPng(root, opts);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.${kind === "jpeg" ? "jpg" : "png"}`;
    a.click();
  } finally {
    document.documentElement.classList.remove("cg-printing");
    document.body.classList.remove("cg-printing");
  }
}
