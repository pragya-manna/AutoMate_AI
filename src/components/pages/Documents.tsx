import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image,
  Megaphone,
  StickyNote,
  Presentation,
  BookOpen,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calendar,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import type { DashboardData, UploadedDocument, DocumentType } from '@/types';
import { StatusBadge } from '../DashboardLayout';
import { deleteDocument, uploadDocument } from '@/api';

type Props = {
  data: DashboardData;
};

const docIcons: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  image: Image,
  announcement: Megaphone,
  notes: StickyNote,
  presentation: Presentation,
  syllabus: BookOpen,
};

const docColors: Record<DocumentType, string> = {
  pdf: 'bg-coral-100 text-coral-600',
  image: 'bg-mint-100 text-mint-600',
  announcement: 'bg-amber-100 text-amber-600',
  notes: 'bg-brand-100 text-brand-600',
  presentation: 'bg-ink-100 text-ink-600',
  syllabus: 'bg-brand-100 text-brand-600',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Documents({ data }: Props) {
  const [docs, setDocs] = useState<UploadedDocument[]>(data.documents);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<UploadedDocument | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedDocs = await Promise.all(
        Array.from(files).map(async (file) => {
          const doc = await uploadDocument(file);

          // The backend may return a "failed" document instead of an HTTP error.
          if (doc.status === 'failed') {
            throw new Error(`The backend could not analyze "${file.name}".`);
          }

          return doc;
        })
      );

      setDocs((prev) => [...uploadedDocs, ...prev]);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Upload failed. Check that the backend and Gemini API key are working.'
      );
    } finally {
      setUploading(false);

      // Let the user select the same file again after a failed upload.
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);

      setDocs((prev) => prev.filter((doc) => doc.id !== id));

      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not delete the document. Check the backend connection.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-ink-300 bg-white hover:border-brand-300 hover:bg-brand-50/30'
          }`}
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          ) : (
            <Upload className="h-7 w-7 text-brand-600" />
          )}
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink-900">
          {uploading ? 'Analyzing with Gemini...' : 'Upload Academic Documents'}
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Drop PDFs, screenshots, announcements, or notes here — or click to browse
        </p>
        <button
          onClick={() => fileInput.current?.click()}
          className="mt-4 btn-primary"
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
          Choose Files
        </button>
        <p className="mt-3 text-xs text-ink-400">
          Gemini will extract deadlines, requirements, and key topics automatically
        </p>
      </div>

      {/* Document grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document list */}
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-display text-lg font-bold text-ink-900">
            All Documents ({docs.length})
          </h3>
          <div className="space-y-3">
            {docs.map((doc) => {
              const Icon = docIcons[doc.type] || FileText;
              return (
                <div
                  key={doc.id}
                  className={`card cursor-pointer p-4 transition-all duration-200 hover:shadow-md ${selected?.id === doc.id ? 'ring-2 ring-brand-400' : ''
                    }`}
                  onClick={() => setSelected(doc)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${docColors[doc.type] || 'bg-ink-100 text-ink-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">{doc.name}</p>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-ink-500">
                        {doc.subject} · {formatSize(doc.size)}
                        {doc.pageCount && ` · ${doc.pageCount} pages`}
                        {' · '}Added {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {doc.summary && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-ink-600">{doc.summary}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {docs.length === 0 && (
              <div className="card p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-2 text-sm text-ink-500">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          <h3 className="mb-3 font-display text-lg font-bold text-ink-900">Details</h3>
          {selected ? (
            <div className="card sticky top-0 space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${docColors[selected.type] || 'bg-ink-100'}`}>
                  {selected.status === 'processing' ? (
                    <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
                  ) : selected.status === 'analyzed' ? (
                    <CheckCircle2 className="h-6 w-6 text-mint-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-coral-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{selected.name}</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              {selected.status === 'processing' ? (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <Sparkles className="mb-1 h-4 w-4" />
                  Gemini is analyzing this document. Extracted information will appear here shortly.
                </div>
              ) : selected.status === 'analyzed' ? (
                <>
                  {selected.summary && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Summary</p>
                      <p className="text-sm text-ink-700">{selected.summary}</p>
                    </div>
                  )}
                  {selected.extractedDates && selected.extractedDates.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                        <Calendar className="h-3.5 w-3.5" /> Extracted Dates
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.extractedDates.map((d) => (
                          <span key={d} className="rounded-lg bg-coral-50 px-2.5 py-1 text-xs font-medium text-coral-700">
                            {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.extractedTasks && selected.extractedTasks.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                        <ListTodo className="h-3.5 w-3.5" /> Extracted Tasks
                      </p>
                      <ul className="space-y-1">
                        {selected.extractedTasks.map((t) => (
                          <li key={t} className="flex items-center gap-2 text-sm text-ink-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg bg-coral-50 p-3 text-sm text-coral-800">
                  Analysis failed. Try re-uploading the document.
                </div>
              )}

              <div className="border-t border-ink-100 pt-3 text-xs text-ink-400">
                <p>Subject: {selected.subject || 'Uncategorized'}</p>
                <p>Size: {formatSize(selected.size)}</p>
                {selected.pageCount && <p>Pages: {selected.pageCount}</p>}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-2 text-sm text-ink-500">Select a document to view AI-extracted details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
