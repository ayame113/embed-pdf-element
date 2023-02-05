// @ts-check

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

const style = `
:host {
  display: block;
  width: 300px;
  height: 150px;
}
iframe {
  width: 100%;
  height: 100%;
}
`;

/** @param {HTMLElement} ctx */
async function render(ctx) {
  const iframe = document.createElement("iframe");

  const file = ctx.getAttribute("src");
  if (!file) {
    throw new Error("plese set `src` attribute to <embed-pdf> element.");
  }
  const fileUrl = new URL(file, location.href);

  const res = await fetch(EmbedPdf.viewerUrl);
  const text = await res.text();
  // inject script tag
  const html = text
    .replace(
      '<meta charset="utf-8">',
      `<meta charset="utf-8"><base href="${EmbedPdf.viewerUrl}">`,
    )
    .replace(
      '<script src="viewer.js"></script>',
      `<script src="viewer.js"></script>
      <script>
        PDFViewerApplicationOptions.set("defaultUrl", "${fileUrl}")
      </script>`,
    );

  const blob = new Blob([html], { type: "text/html" });
  iframe.src = URL.createObjectURL(blob);

  return iframe;
}

/**
 * ```html
 * <script src="https://deno.land/x/embed_pdf/mod.js" type="module"></script>
 * <embed-pdf src="./path/to/file.pdf"></embed-pdf>
 * ```
 *
 * ```ts
 * import { EmbedPdf } from "https://deno.land/x/embed_pdf/mod.js";
 *
 * EmbedPdf.viewerUrl = "https://mozilla.github.io/pdf.js/web/viewer.html";
 * ```
 */
export class EmbedPdf extends HTMLElement {
  static viewerUrl = new URL("./vendor/pdfjs/web/viewer.html", import.meta.url)
    .toString();
  #shadowRoot;
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "closed" });
    const styleSheet = new CSSStyleSheet();
    styleSheet.replace(style);
    this.#shadowRoot.adoptedStyleSheets = [styleSheet];
  }
  async connectedCallback() {
    this.#shadowRoot.append(await render(this));
  }
  disconnectedCallback() {
    this.#shadowRoot.innerHTML = "";
  }
}
customElements.define("embed-pdf", EmbedPdf);
