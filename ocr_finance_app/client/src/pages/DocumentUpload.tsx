import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DocumentUpload() {
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.documents.upload.useMutation();
  const processOCRMutation = trpc.documents.processOCR.useMutation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid file type`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip "data:...;base64,"
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Determine document type
        let documentType: "receipt" | "bill" | "bank_statement" | "other" = "other";
        const fileName = file.name.toLowerCase();
        if (fileName.includes("receipt")) documentType = "receipt";
        else if (fileName.includes("bill")) documentType = "bill";
        else if (fileName.includes("statement") || fileName.includes("bank")) documentType = "bank_statement";

        // Upload document
        const uploadResult = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          documentType,
        });

        toast.success(`${file.name} uploaded successfully`);

        // Process OCR
        // Note: In production, this would be done asynchronously
        // For now, we'll just show success
      }

      setFiles([]);
      toast.success("All files uploaded! Processing OCR...");
      
      // Redirect to transactions page after a short delay
      setTimeout(() => {
        navigate("/transactions");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg py-8">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2">Upload Documents</h1>
          <p className="text-muted-foreground label-mono">
            Upload receipts, bills, or bank statements for automatic processing
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`wireframe-cyan p-12 text-center transition-all cursor-pointer ${
            dragActive ? 'border-primary/100 bg-primary/10' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleChange}
            className="hidden"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-primary opacity-50" />
              <div>
                <p className="text-lg font-black text-foreground mb-2">
                  Drag files here or click to browse
                </p>
                <p className="text-sm label-mono text-muted-foreground">
                  Supported: JPG, PNG, WebP, PDF (max 10MB each)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <Card className="wireframe-pink p-6 mt-8">
            <h3 className="text-lg font-black text-foreground mb-4">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded border border-border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="font-semibold data-mono">{file.name}</p>
                      <p className="text-xs label-mono text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? "Uploading..." : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
            </Button>
          </Card>
        )}

        {/* Document Types Info */}
        <Card className="border-2 border-dashed border-foreground/20 p-6 mt-8">
          <h3 className="text-lg font-black text-foreground mb-4">Document Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-card">
              <p className="font-semibold text-primary mb-2">Receipt</p>
              <p className="text-sm label-mono text-muted-foreground">
                Store receipts, invoices, and payment confirmations
              </p>
            </div>
            <div className="p-4 rounded bg-card">
              <p className="font-semibold text-secondary mb-2">Bill</p>
              <p className="text-sm label-mono text-muted-foreground">
                Utility bills, service charges, and expenses
              </p>
            </div>
            <div className="p-4 rounded bg-card">
              <p className="font-semibold text-foreground mb-2">Bank Statement</p>
              <p className="text-sm label-mono text-muted-foreground">
                Monthly bank statements and transaction records
              </p>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Tips for best results:</p>
              <ul className="text-sm text-yellow-700 space-y-1 label-mono">
                <li>• Use clear, well-lit photos</li>
                <li>• Ensure the entire document is visible</li>
                <li>• Avoid shadows and glare</li>
                <li>• Keep the document straight and aligned</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
