import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { formatDateMMDDYYYY, getShortInteractionId } from "../utils/formatUtils";

// PDF.js worker - use CDN for reliable loading across Vite/builds
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 25;

const ReportDetailsModal = ({ report, reportUrl, interactions = [], onClose, reviewMode = false, onSignReport, isSigning = false, isLoadingReportUrl = false }) => {
  const [imageError, setImageError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imgNaturalSize, setImgNaturalSize] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const pdfBlobUrlRef = useRef(null);
  const [contentRendered, setContentRendered] = useState(false);

  const viewerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const zoomIn = () => setZoomLevel((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  const zoomOut = () => setZoomLevel((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));
  const resetZoom = () => setZoomLevel(100);

  const pdfScale = useMemo(() => zoomLevel / 100, [zoomLevel]);

  // Reset state when report changes
  useEffect(() => {
    setNumPages(null);
    setPdfError(null);
    setContentRendered(false);
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }
    setPdfBlobUrl(null);
    setImageError(false);
    setImgNaturalSize(null);
    setZoomLevel(100);
  }, [report?.id]);

  // Reset contentRendered when reportUrl becomes available (new content to load)
  useEffect(() => {
    if (reportUrl && !isLoadingReportUrl) setContentRendered(false);
  }, [reportUrl, isLoadingReportUrl]);

  // When type is neither PDF nor image, nothing to "load" in viewer — stop spinner
  const isPdfCheck = report?.fileMetadata?.mimeType?.startsWith("application/pdf");
  const isImageCheck = report?.fileMetadata?.mimeType?.startsWith("image/");
  useEffect(() => {
    if (reportUrl && !isLoadingReportUrl && !isPdfCheck && !isImageCheck) setContentRendered(true);
  }, [reportUrl, isLoadingReportUrl, isPdfCheck, isImageCheck]);

  // Fetch PDF as blob for CORS support
  useEffect(() => {
    if (!reportUrl || !report?.fileMetadata?.mimeType?.startsWith("application/pdf")) {
      setPdfBlobUrl(null);
      pdfBlobUrlRef.current = null;
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setPdfError(null);
        setPdfBlobUrl(null);
        const res = await fetch(reportUrl, { mode: "cors" });
        if (!res.ok) throw new Error("Failed to fetch PDF");
        const blob = await res.blob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          pdfBlobUrlRef.current = url;
          setPdfBlobUrl(url);
        }
      } catch (err) {
        if (!cancelled) {
          setPdfError(err?.message || "Failed to load PDF");
          setPdfBlobUrl(null);
          setContentRendered(true);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, [reportUrl, report?.id]);

  // Touch move needs passive: false for preventDefault (pan instead of scroll)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const handler = (e) => {
      if (!isDraggingRef.current || !e.touches?.[0]) return;
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      el.scrollLeft = dragStartRef.current.scrollLeft - dx;
      el.scrollTop = dragStartRef.current.scrollTop - dy;
      e.preventDefault();
    };
    el.addEventListener("touchmove", handler, { passive: false });
    return () => el.removeEventListener("touchmove", handler);
  }, [report?.id, reportUrl]);

  if (!report) return null;

  const isPdf = report.fileMetadata?.mimeType?.startsWith("application/pdf");
  const isImage = report.fileMetadata?.mimeType?.startsWith("image/");
  const fileTypeLabel = report.fileMetadata?.mimeType
    ? isPdf ? "PDF" : report.fileMetadata.mimeType.replace("image/", "").toUpperCase()
    : "";
  const linkedInteraction = report.interactionId && interactions?.find((i) => i.id === report.interactionId);
  const reportTypeLabel = (report.reportType || "")
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const detailFields = [
    { label: "Report Type", value: reportTypeLabel || "-" },
    { label: "Procedure Date", value: formatDateMMDDYYYY(report.procedureDate) || "-" },
    { label: "Report Generated Date", value: formatDateMMDDYYYY(report.reportGeneratedDate) || "-" },
    { label: "Lab Name", value: report.labMetadata?.labName || "-" },
    { label: "Lab Address", value: report.labMetadata?.labAddress || "-" },
    { label: "External Report ID", value: report.labMetadata?.externalReportId || "-" },
    { label: "Linked Interaction", value: linkedInteraction ? getShortInteractionId(linkedInteraction.interactionSerial) : "-" },
    { label: "Notes", value: report.notes || "-" },
    { label: "File Type", value: fileTypeLabel || "-" },
  ];

  // Pan handlers
  const onMouseDown = (e) => {
    if (!viewerRef.current) return;
    isDraggingRef.current = true;
    viewerRef.current.style.cursor = "grabbing";
    viewerRef.current.style.userSelect = "none";
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewerRef.current.scrollLeft,
      scrollTop: viewerRef.current.scrollTop,
    };
  };

  const onMouseMove = (e) => {
    if (!isDraggingRef.current || !viewerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    viewerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    viewerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const stopDragging = () => {
    if (!viewerRef.current) return;
    isDraggingRef.current = false;
    viewerRef.current.style.cursor = "grab";
    viewerRef.current.style.userSelect = "auto";
  };

  const onTouchStart = (e) => {
    if (!viewerRef.current || !e.touches?.[0]) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollLeft: viewerRef.current.scrollLeft,
      scrollTop: viewerRef.current.scrollTop,
    };
  };


  const onTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Real image dimensions (no transform) - 100% = fit to viewport, zoom scales from that
  const MAX_FIT = 800;
  const fitScale = imgNaturalSize
    ? Math.min(MAX_FIT / imgNaturalSize.w, MAX_FIT / imgNaturalSize.h, 1)
    : 1;
  const baseW = imgNaturalSize ? imgNaturalSize.w * fitScale : 0;
  const baseH = imgNaturalSize ? imgNaturalSize.h * fitScale : 0;
  const imgDisplayWidth = baseW ? (baseW * zoomLevel) / 100 : null;
  const imgDisplayHeight = baseH ? (baseH * zoomLevel) / 100 : null;

  const panProps = {
    ref: viewerRef,
    onMouseDown,
    onMouseMove,
    onMouseUp: stopDragging,
    onMouseLeave: stopDragging,
    onTouchStart,
    onTouchEnd,
    style: { cursor: "grab" },
  };

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 pb-4 pt-0 !mt-0 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{reviewMode ? "Review Report" : "Report Details"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="w-full lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col overflow-y-auto bg-slate-50/50">
            <div className="p-5 space-y-4">
              {detailFields.map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{field.label}</label>
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">{field.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[280px] lg:min-h-0 bg-slate-100 min-w-0">
            {(reportUrl && (isPdf || isImage)) && (
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zoom</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoomLevel <= ZOOM_MIN}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    title="Zoom out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="min-w-[3.5rem] text-center text-sm font-semibold text-slate-700">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoomLevel >= ZOOM_MAX}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    title="Zoom in"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="ml-2 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Reset zoom"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
              {/* Spinner: while URL loading or while content (image/PDF) loading */}
              {(!reportUrl || isLoadingReportUrl || (reportUrl && !isLoadingReportUrl && !contentRendered)) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 p-4 bg-white z-10">
                  <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">Loading report…</span>
                </div>
              )}
              {/* Viewer: render when we have URL so image/PDF can load; hidden until contentRendered */}
              {reportUrl && !isLoadingReportUrl && (
                <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${!contentRendered ? 'opacity-0 pointer-events-none' : ''}`}>
              {isPdf ? (
                <div
                  {...panProps}
                  className="flex-1 overflow-auto p-4"
                >
                  {pdfError ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-4">
                      <span className="text-sm font-medium">Failed to load PDF</span>
                      <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline">
                        Open in new tab
                      </a>
                    </div>
                  ) : !pdfBlobUrl ? (
                    <div className="flex-1 min-h-[200px]" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 min-w-max w-fit">
                      <Document
                        key={pdfBlobUrl}
                        file={pdfBlobUrl}
                        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setContentRendered(true); }}
                        onLoadError={(err) => {
                          setPdfError(err?.message || "PDF failed to load");
                          setContentRendered(true);
                        }}
                        loading={null}
                      >
                        {Array.from({ length: numPages || 0 }, (_, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm shrink-0 w-fit overflow-hidden">
                            <Page
                              pageNumber={i + 1}
                              scale={pdfScale}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />
                          </div>
                        ))}
                      </Document>
                      {numPages ? (
                        <div className="text-xs font-semibold text-slate-500 pb-4">
                          {numPages} page{numPages > 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : isImage ? (
                imageError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-4">
                    <span className="text-sm font-medium">Failed to load image</span>
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline">
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <div
                    {...panProps}
                    className="flex-1 overflow-auto p-4 flex items-start justify-start"
                  >
                    <div
                      className="flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                      style={
                        imgDisplayWidth != null && imgDisplayHeight != null
                          ? { width: imgDisplayWidth, height: imgDisplayHeight, minWidth: imgDisplayWidth, minHeight: imgDisplayHeight }
                          : { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }
                      }
                    >
                      <img
                        src={reportUrl}
                        alt={report.reportType}
                        className="block select-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={
                          imgDisplayWidth != null && imgDisplayHeight != null
                            ? { width: imgDisplayWidth, height: imgDisplayHeight, objectFit: "contain" }
                            : { maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }
                        }
                        onLoad={(e) => {
                          const { naturalWidth, naturalHeight } = e.target;
                          setImgNaturalSize({ w: naturalWidth, h: naturalHeight });
                          setContentRendered(true);
                        }}
                        onError={() => { setImageError(true); setContentRendered(true); }}
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-4">
                  <span className="text-sm font-medium">Preview not available</span>
                  <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline">
                    Open in new tab
                  </a>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        </div>

        {reviewMode && (
          <div className="shrink-0 flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => typeof onSignReport === "function" && onSignReport()}
              disabled={isSigning}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border-2 border-green-600 text-green-700 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {isSigning ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing…</span>
                </>
              ) : (
                'Sign'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsModal;
