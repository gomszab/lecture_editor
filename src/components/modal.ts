export interface ModalField {
  label: string;
  id: string;
  placeholder?: string;
}

const overlay   = document.getElementById("modal-overlay")!;
const titleEl   = document.getElementById("modal-title")!;
const bodyEl    = document.getElementById("modal-body")!;
const okBtn     = document.getElementById("modal-ok")!;
const cancelBtn = document.getElementById("modal-cancel")!;

let _resolve: ((v: Record<string, string> | null) => void) | null = null;

function close(value: Record<string, string> | null): void {
  overlay.classList.remove("open");
  _resolve?.(value);
  _resolve = null;
}

okBtn.addEventListener("click", () => {
  const result: Record<string, string> = {};
  bodyEl.querySelectorAll<HTMLInputElement>("input").forEach(i => {
    result[i.dataset.fieldId!] = i.value.trim();
  });
  close(result);
});

cancelBtn.addEventListener("click", () => close(null));

overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });

export function showModal(
  title: string,
  fields: ModalField[],
): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    _resolve = resolve;
    titleEl.textContent = title;
    bodyEl.innerHTML = "";
    for (const f of fields) {
      const lbl = document.createElement("label");
      lbl.textContent = f.label;
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = f.placeholder ?? "";
      inp.dataset.fieldId = f.id;
      bodyEl.appendChild(lbl);
      bodyEl.appendChild(inp);
    }
    overlay.classList.add("open");
    (bodyEl.querySelector("input") as HTMLInputElement | null)?.focus();
  });
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    titleEl.textContent = "Confirm";
    bodyEl.innerHTML = `<p style="margin:0 0 12px;color:#cdd6f4">${message}</p>`;
    _resolve = (r) => resolve(r !== null);
    overlay.classList.add("open");
  });
}
