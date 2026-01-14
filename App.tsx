import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Split,
  Eye,
  Edit3,
  Copy,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Check,
  Trash2,
  FileText,
  Code2,
  Sparkles,
  Menu, // Thêm icon nếu cần menu mobile, nhưng ở đây ta dùng layout adaptive
} from "lucide-react";
import { ViewMode, Toast } from "./types";
import {
  cleanLatex,
  copyNodeAsImage,
  copyToClipboard,
  extractAndCopyMathML,
} from "./utils/exportUtils";
import { generateMathFromPrompt } from "./services/geminiService";
import { Button } from "./components/Button";

// Default prompt with example
const DEFAULT_MARKDOWN = `
# MathBridge

Dán công thức bình thường thì nhớ thêm **$$** ở 2 đầu nhé.

Dán công thức (kể cả dạng text lỗi), bấm **"Smart Convert"** để sửa lỗi.

Ví dụ Output MathML:
$$
P(y=1) = \\frac{e^{\\beta_0 + \\beta_1 x}}{1 + e^{\\beta_0 + \\beta_1 x}}
$$
`;

export default function App() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(markdown);
    if (success) addToast("Đã copy mã Markdown!", "success");
  };

  const handleCopyImage = async () => {
    addToast("Đang tạo ảnh...", "info");
    const success = await copyNodeAsImage("preview-content");
    if (success) {
      addToast("Đã copy ảnh! Dán vào Word ngay (Ctrl+V)", "success");
    } else {
      addToast("Lỗi khi tạo ảnh", "error");
    }
  };

  const handleCopyMathML = async () => {
    if (!markdown.trim()) {
      addToast("Chưa có công thức nào để copy", "error");
      return;
    }

    addToast("Đang lấy mã MathML...", "info");
    const success = await extractAndCopyMathML("preview-content");
    if (success) {
      addToast("Đã copy MathML! Dán vào Word (Keep Text Only)", "success");
    } else {
      addToast("Không tìm thấy công thức render hợp lệ", "error");
    }
  };

  const handleSmartConvert = async () => {
    if (!markdown.trim()) {
      addToast("Editor trống, hãy dán text vào trước", "error");
      return;
    }

    setIsFixing(true);
    try {
      const result = await generateMathFromPrompt(markdown);
      setMarkdown(result);
      addToast("AI đã sửa lỗi và định dạng lại công thức!", "success");
    } catch (error) {
      addToast("Lỗi khi gọi AI sửa lỗi", "error");
    } finally {
      setIsFixing(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateMathFromPrompt(aiPrompt);
      setMarkdown((prev) => prev + "\n\n" + result);
      setShowAiModal(false);
      setAiPrompt("");
      addToast("Đã tạo công thức từ AI", "success");
    } catch (error) {
      addToast("Lỗi kết nối AI", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Header - Compact on Mobile */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-base md:text-lg text-white">
              MathBridge
            </h1>
            {/* Ẩn description trên mobile để gọn */}
            <p className="hidden sm:block text-xs text-zinc-400">
              Word MathML & Image Converter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Modes Container */}
          <div className="bg-zinc-800/50 p-1 rounded-lg border border-zinc-700 flex gap-1 mr-2 md:mr-4">
            <button
              onClick={() => setViewMode(ViewMode.Edit)}
              className={`p-1.5 md:p-2 rounded-md transition-all ${
                viewMode === ViewMode.Edit
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Editor Only"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Split)}
              className={`p-1.5 md:p-2 rounded-md transition-all ${
                viewMode === ViewMode.Split
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Split View"
            >
              <Split size={16} />
            </button>
            <button
              onClick={() => setViewMode(ViewMode.Preview)}
              className={`p-1.5 md:p-2 rounded-md transition-all ${
                viewMode === ViewMode.Preview
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Preview Only"
            >
              <Eye size={16} />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Wand2 size={16} />}
            onClick={() => setShowAiModal(true)}
            className="whitespace-nowrap"
          >
            {/* Trên mobile chỉ hiện icon, desktop hiện chữ */}
            <span className="hidden sm:inline">Create New</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </header>

      {/* Toolbar - Scrollable on mobile + Icon only labels */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 md:px-6 md:py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMarkdown("")}
            icon={<Trash2 size={14} />}
          >
            <span className="hidden sm:inline">Clear</span>
          </Button>

          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 whitespace-nowrap"
            size="sm"
            onClick={handleSmartConvert}
            disabled={isFixing}
            icon={
              isFixing ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )
            }
          >
            {isFixing ? (
              "Fixing..."
            ) : (
              <>
                <span className="hidden sm:inline">Smart Convert (AI)</span>
                <span className="sm:hidden">Smart Fix</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyCode}
            title="Copy Raw Source"
          >
            <Code2 size={14} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyMathML}
            icon={<FileText size={14} />}
            className="border-indigo-500/30 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/20 whitespace-nowrap"
          >
            <span className="hidden md:inline">Copy MathML</span>
            <span className="md:hidden">MathML</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyImage}
            icon={<ImageIcon size={14} />}
          >
            <span className="hidden md:inline">Copy Image</span>
            <span className="md:hidden">Img</span>
          </Button>
        </div>
      </div>

      {/* Main Content - Smart Responsive Layout */}
      {/* Mobile: flex-col (dọc), Desktop: flex-row (ngang) khi ở Split mode */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === ViewMode.Split || viewMode === ViewMode.Edit) && (
          <div
            className={`
            flex-1 flex flex-col bg-zinc-950
            ${
              viewMode === ViewMode.Split
                ? "w-full h-1/2 lg:w-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800" // Mobile: Full width/Half height. Desktop: Half width/Full height
                : "w-full h-full"
            }
          `}
          >
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 w-full h-full p-4 md:p-6 bg-transparent text-zinc-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
              placeholder="Dán công thức vào thì nhớ thêm '$$' ở 2 đầu công thức nhé hoặc dán text loằng ngoằng vào đây rồi bấm 'Smart Convert'..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
          <div
            className={`
            flex-1 flex flex-col bg-zinc-900/50
            ${
              viewMode === ViewMode.Split
                ? "w-full h-1/2 lg:w-1/2 lg:h-full"
                : "w-full h-full"
            }
          `}
          >
            <div
              ref={previewRef}
              className="flex-1 w-full h-full p-4 md:p-8 overflow-auto"
            >
              <div
                id="preview-content"
                className="markdown-body bg-transparent"
              >
                {markdown ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {markdown}
                  </ReactMarkdown>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Preview area</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-[10px] md:text-xs text-zinc-500 flex justify-between shrink-0">
              <span>Smart Convert by Gemini</span>
              <span className="hidden sm:inline">
                Paste as "Keep Text Only"
              </span>
            </div>
          </div>
        )}
      </main>

      {/* AI Modal - Responsive Width & Margin */}
      {showAiModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 mx-4">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wand2 className="text-indigo-500" size={20} />
                  AI Generator
                </h3>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-zinc-400 text-sm mb-4">
                Mô tả công thức hoặc dán text lỗi để AI sửa.
              </p>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full h-32 md:h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none mb-4 text-sm"
                placeholder="e.g. Công thức tính diện tích hình tròn..."
              />

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowAiModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  icon={
                    isGenerating ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Wand2 size={16} />
                    )
                  }
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast - Adjusted position for mobile */}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-bottom md:slide-in-from-right duration-300
              ${
                toast.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : toast.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-zinc-800/90 border-zinc-700 text-zinc-100"
              }
            `}
          >
            {toast.type === "success" && <Check size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
