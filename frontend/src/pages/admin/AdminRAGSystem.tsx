import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Database,
  Upload,
  Search,
  Settings,
  Zap,
  FileText,
  MessageSquare,
  BarChart3,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

// API Configuration
const RAG_API_BASE = `${import.meta.env.VITE_API_GATEWAY_URL}/api/rag`;

interface Document {
  _id: string;
  title: string;
  source_type: string;
  content: string;
  created_at?: string;
  metadata?: any;
  // File metadata
  filename?: string;
  file_type?: string;
  file_size?: number;
  file_path?: string;
  file_id?: string; // GridFS file ID for viewing original file
  // PDF-specific metadata
  page_count?: number;
  pdf_title?: string;
  pdf_author?: string;
  pdf_subject?: string;
  pdf_creator?: string;
  // Text document metadata
  content_length?: number;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  fileName: string;
}

const AdminRAGSystem = () => {
  const [activeTab, setActiveTab] = useState("knowledge-base");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    fileName: "",
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [textUploadData, setTextUploadData] = useState({
    title: "",
    content: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load all documents from API
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${RAG_API_BASE}/documents`);
      setDocuments(response.data.documents || []);
      toast({
        title: "Documents Loaded",
        description: `Successfully loaded ${
          response.data.count || 0
        } documents`,
      });
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Error",
        description:
          "Failed to load documents. Please check if services are running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadProgress({
      isUploading: true,
      progress: 0,
      fileName: file.name,
    });

    try {
      const response = await axios.post(
        `${RAG_API_BASE}/ingest/file`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress((prev) => ({ ...prev, progress }));
          },
        }
      );

      toast({
        title: "Upload Successful",
        description: `${file.name} has been processed successfully`,
      });

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Upload text document
  const handleTextUpload = async () => {
    if (!textUploadData.title || !textUploadData.content) {
      toast({
        title: "Validation Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress({
        isUploading: true,
        progress: 50,
        fileName: textUploadData.title,
      });

      await axios.post(`${RAG_API_BASE}/ingest/text`, {
        text: textUploadData.content,
        title: textUploadData.title,
        metadata: {
          source: "admin_upload",
          uploaded_at: new Date().toISOString(),
        },
      });

      toast({
        title: "Text Document Added",
        description: `"${textUploadData.title}" has been added successfully`,
      });

      setShowUploadModal(false);
      setTextUploadData({ title: "", content: "" });
      await loadDocuments();
    } catch (error) {
      console.error("Text upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to add text document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: "",
      });
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${RAG_API_BASE}/documents/${documentId}`);

      toast({
        title: "Document Deleted",
        description: `"${title}" has been removed successfully`,
      });

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter documents based on search
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalDocuments: documents.length,
    categories: new Set(documents.map((d) => d.source_type)).size,
    totalChunks: documents.reduce(
      (acc, doc) => acc + (doc.metadata?.chunks?.length || 0),
      0
    ),
  };

  const knowledgeBaseStats = [
    {
      label: "Total Documents",
      value: stats.totalDocuments.toString(),
      icon: FileText,
      color: "blue",
    },
    {
      label: "Categories",
      value: stats.categories.toString(),
      icon: Database,
      color: "green",
    },
    {
      label: "Total Chunks",
      value: stats.totalChunks.toString(),
      icon: MessageSquare,
      color: "purple",
    },
    {
      label: "System Status",
      value: loading ? "Loading..." : "Active",
      icon: BarChart3,
      color: "orange",
    },
  ];

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Get file size estimate
  const getContentSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const tabs = [
    { id: "knowledge-base", label: "Knowledge Base", icon: Database },
    { id: "ai-queries", label: "AI Queries", icon: MessageSquare },
    { id: "system-config", label: "System Config", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                RAG System Management
              </h1>
              <p className="text-slate-600 mt-1">
                Manage knowledge base and AI-powered assistance
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress Toast */}
        {uploadProgress.isUploading && (
          <div className="fixed top-4 right-4 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50 min-w-[300px]">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              <span className="font-semibold text-slate-900">
                Uploading Document
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              {uploadProgress.fileName}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {uploadProgress.progress}% complete
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {knowledgeBaseStats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: "bg-blue-100 text-blue-600",
              green: "bg-green-100 text-green-600",
              purple: "bg-purple-100 text-purple-600",
              orange: "bg-orange-100 text-orange-600",
            };

            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Knowledge Base Tab */}
            {activeTab === "knowledge-base" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <FileText className="h-4 w-4" />
                      Add Text Document
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProgress.isUploading}
                    >
                      <Upload className="h-4 w-4" />
                      Upload File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      onClick={loadDocuments}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Documents Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    <span className="ml-3 text-slate-600">
                      Loading documents...
                    </span>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No documents found</p>
                    <p className="text-slate-500 text-sm mt-2">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Upload your first document to get started"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Document
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Type
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Created
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr
                            key={doc._id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100">
                                  <FileText className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="max-w-md">
                                  <span className="font-medium text-slate-900 block truncate">
                                    {doc.title || doc.filename || "Untitled"}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {doc.filename && (
                                      <span className="text-xs text-slate-500 truncate">
                                        📎 {doc.filename}
                                      </span>
                                    )}
                                    {doc.page_count && (
                                      <span className="text-xs text-slate-400">
                                        • {doc.page_count} pages
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {doc.source_type || "unknown"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-700 text-sm">
                                {formatDate(doc.created_at)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Processed
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {/* Eye icon for PDFs/Files with GridFS storage */}
                                {doc.file_id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(
                                        `${RAG_API_BASE}/documents/${doc._id}/view`,
                                        "_blank"
                                      )
                                    }
                                    title="View original file"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* View button only for text documents (no file_id) */}
                                {!doc.file_id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setTextUploadData({
                                        title: doc.title || "Untitled",
                                        content:
                                          doc.content ||
                                          "No content available for this document.",
                                      });
                                      setShowUploadModal(true);
                                    }}
                                    title="View text content"
                                  >
                                    View
                                  </Button>
                                )}

                                {/* Delete button for all documents */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteDocument(doc._id, doc.title)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* AI Queries Tab - Coming Soon */}
            {activeTab === "ai-queries" && (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">AI Query Analytics</p>
                <p className="text-slate-500 text-sm mt-2">
                  Coming soon - Track and analyze AI chat interactions
                </p>
              </div>
            )}

            {/* System Config Tab - Coming Soon */}
            {activeTab === "system-config" && (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">System Configuration</p>
                <p className="text-slate-500 text-sm mt-2">
                  Coming soon - Configure RAG system settings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Text Document Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-slate-900">
                  Add Text Document
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setTextUploadData({ title: "", content: "" });
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={textUploadData.title}
                    onChange={(e) =>
                      setTextUploadData({
                        ...textUploadData,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Platform Pricing Guide"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Document Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={textUploadData.content}
                    onChange={(e) =>
                      setTextUploadData({
                        ...textUploadData,
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter the document content here..."
                    rows={12}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {(textUploadData.content || "").length} characters
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">
                        Tips for better results:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Use clear, descriptive titles</li>
                        <li>Include relevant keywords in the content</li>
                        <li>Organize information in paragraphs</li>
                        <li>
                          Add details about your platform features and policies
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end sticky bottom-0 bg-white">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setTextUploadData({ title: "", content: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  onClick={handleTextUpload}
                  disabled={
                    !textUploadData.title ||
                    !textUploadData.content ||
                    uploadProgress.isUploading
                  }
                >
                  {uploadProgress.isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRAGSystem;
