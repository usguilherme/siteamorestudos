"use client";

import { useState } from "react";

interface PdfReaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
}

export default function PdfReader({ onTextExtracted }: PdfReaderProps) {
  const [pdfFileName, setPdfFileName] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setIsAiLoading(true);
    setStatusMsg("Lendo arquivo PDF...");

    try {
      // Import dinâmico correto para dentro de funções
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
      
      if (typeof window !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      let extractedText = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        extractedText += `--- Página ${i} ---\n` + pageText + "\n\n";
      }

      onTextExtracted(extractedText, file.name);
      setStatusMsg("✅ PDF lido com sucesso!");
    } catch (error: any) {
      setStatusMsg(`❌ Erro ao ler PDF: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 shadow-sm">
          📁 Enviar Arquivo PDF
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
            disabled={isAiLoading}
          />
        </label>
        {pdfFileName && (
          <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2.5 rounded-xl truncate">
            📄 {pdfFileName}
          </span>
        )}
      </div>
      {statusMsg && (
        <p className={`text-xs sm:text-sm font-medium ${statusMsg.includes("Sucesso") || statusMsg.includes("sucesso") ? "text-emerald-600" : statusMsg.includes("Erro") ? "text-red-600" : "text-indigo-600"}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}