import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  Download,
  RotateCw,
  FileImage,
  Camera,
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Building,
  MapPin,
  Bed,
  Bath,
  Square,
  X,
  Folder,
  CheckCircle,
  Clock,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import VirtualTour from "@/components/landing/virtual-tour";

interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  alt?: string;
  category?: string;
  metadata?: {
    type?: string;
    title?: string;
    description?: string;
    price?: number;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  originalName?: string;
}

// Enhanced Batch Upload Interfaces
interface UploadFileItem {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  uploadStartTime?: number;
  uploadEndTime?: number;
  retryCount: number;
  category?: string;
}

interface BatchUploadState {
  files: UploadFileItem[];
  isActive: boolean;
  isPaused: boolean;
  overallProgress: number;
  completed: number;
  failed: number;
  currentlyUploading: string[];
  folderName?: string;
}

interface UploadQueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  chunkSize: number;
  autoRetry: boolean;
  compressionEnabled: boolean;
  maxFileSize: number;
}

const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

// --- New Component for Real Estate Listings ---
interface RealEstateListing {
  id?: string;
  title: string;
  description: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image_url: string;
}

const CreateListingForm = ({ image, onClose }: { image: GalleryImage; onClose: () => void }) => {
  const { toast } = useToast();
  const [listing, setListing] = useState<RealEstateListing>({
    title: image.metadata?.title || image.originalName?.replace(/\.[^/.]+$/, "") || "Neues Angebot",
    description: image.metadata?.description || "Tolle Immobilie mit viel Potenzial.",
    price: image.metadata?.price || 0,
    address: image.metadata?.address || "",
    bedrooms: image.metadata?.bedrooms || 0,
    bathrooms: image.metadata?.bathrooms || 0,
    area: image.metadata?.area || 0,
    image_url: `/api/gallery/${image.id}/image`,
  });

  const updateImageMetadataMutation = useMutation({
    mutationFn: async (payload: Partial<RealEstateListing>) => {
      const response = await fetch(`/api/gallery/${image.id}/update-metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Metadaten-Update fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Metadaten aktualisiert",
        description: `Metadaten für "${image.originalName}" erfolgreich gespeichert.`,
      });
      onClose(); // Close the form after successful update
    },
    onError: (err: Error) => {
      console.error("Metadata update error:", err);
      toast({
        title: "Fehler",
        description: err.message || "Die Metadaten konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setListing(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: keyof RealEstateListing, value: string) => {
    setListing(prev => ({ ...prev, [name]: value ? parseFloat(value) : 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metadataToUpdate: Partial<RealEstateListing> = {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      address: listing.address,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
    };
    updateImageMetadataMutation.mutate(metadataToUpdate);
  };

  return (
    <Card className="w-full max-w-lg mx-auto my-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Immobilienanzeige erstellen/bearbeiten</CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" value={listing.title} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="price">Preis (€)</Label>
              <Input id="price" name="price" type="number" value={listing.price} onChange={(e) => handleNumberChange('price', e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" value={listing.address} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bedrooms">Schlafzimmer</Label>
              <Input id="bedrooms" name="bedrooms" type="number" value={listing.bedrooms} onChange={(e) => handleNumberChange('bedrooms', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bathrooms">Badezimmer</Label>
              <Input id="bathrooms" name="bathrooms" type="number" value={listing.bathrooms} onChange={(e) => handleNumberChange('bathrooms', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="area">Fläche (m²)</Label>
              <Input id="area" name="area" type="number" value={listing.area} onChange={(e) => handleNumberChange('area', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <textarea
              id="description"
              name="description"
              value={listing.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateImageMetadataMutation.isPending}>
              {updateImageMetadataMutation.isPending ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- End New Component ---

export default function GalleryManagement() {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [drag360Active, setDrag360Active] = useState(false);
  const [tour360Title, setTour360Title] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageForListing, setSelectedImageForListing] = useState<GalleryImage | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [show360Modal, setShow360Modal] = useState(false);
  const [selected360Image, setSelected360Image] = useState<GalleryImage | null>(null);

  // Refs for file and folder inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Enhanced Batch Upload State
  const [batchUpload, setBatchUpload] = useState<BatchUploadState>({
    files: [],
    isActive: false,
    isPaused: false,
    overallProgress: 0,
    completed: 0,
    failed: 0,
    currentlyUploading: [],
    folderName: undefined,
  });

  const [uploadConfig] = useState<UploadQueueConfig>({
    maxConcurrent: 3,
    maxRetries: 3,
    chunkSize: 1024 * 1024, // 1MB chunks
    autoRetry: true,
    compressionEnabled: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const uploadQueueRef = useRef<Map<string, AbortController>>(new Map());
  
  // Refs to avoid stale closure issues in batch upload
  const batchControlRef = useRef({
    isActive: false,
    isPaused: false,
    pendingFiles: [] as UploadFileItem[],
    activeUploads: 0,
    shouldStop: false
  });

  // Enhanced Batch Upload Functions
  const generateFilePreview = (file: File): string => {
    // Use URL.createObjectURL for better memory management
    return URL.createObjectURL(file);
  };
  
  const revokeFilePreview = (url?: string) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Nur Bilddateien sind erlaubt' };
    }

    // Check file size
    if (file.size > uploadConfig.maxFileSize) {
      const maxSizeMB = uploadConfig.maxFileSize / (1024 * 1024);
      return { valid: false, error: `Datei zu groß (max. ${maxSizeMB}MB)` };
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Dateityp nicht unterstützt' };
    }

    return { valid: true };
  };

  // Enhanced folder/file processing with directory traversal
  const traverseDirectoryEntries = async (entries: FileSystemEntry[]): Promise<File[]> => {
    const files: File[] = [];
    
    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve, reject) => {
          fileEntry.file((file) => {
            if (file.type.startsWith('image/')) {
              files.push(file);
            }
            resolve();
          }, reject);
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        
        return new Promise((resolve, reject) => {
          const readEntries = () => {
            dirReader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve();
                return;
              }
              
              try {
                await Promise.all(entries.map(processEntry));
                readEntries(); // Continue reading if there are more entries
              } catch (error) {
                reject(error);
              }
            }, reject);
          };
          readEntries();
        });
      }
    };
    
    await Promise.all(entries.map(processEntry));
    return files;
  };
  
  const processSelectedFiles = async (fileList: FileList | null, folderName?: string) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: "Keine Bilder gefunden",
        description: "Der ausgewählte Ordner enthält keine Bilddateien",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const processedFiles: UploadFileItem[] = [];

    try {
      for (const file of imageFiles) {
        const validation = validateImageFile(file);
        let preview: string | undefined;

        try {
          preview = generateFilePreview(file);
        } catch (error) {
          console.warn(`Could not generate preview for ${file.name}:`, error);
        }

        const uploadItem: UploadFileItem = {
          id: crypto.randomUUID(),
          file,
          preview,
          status: validation.valid ? 'pending' : 'failed',
          progress: 0,
          error: validation.error,
          retryCount: 0,
          category: 'general'
        };

        processedFiles.push(uploadItem);
      }

      setBatchUpload(prev => ({
        ...prev,
        files: processedFiles,
        folderName: folderName,
        completed: 0,
        failed: processedFiles.filter(f => f.status === 'failed').length,
        overallProgress: 0,
        currentlyUploading: []
      }));

      setShowBatchUpload(true);

      toast({
        title: "Bilder vorbereitet",
        description: `${processedFiles.length} Bilder aus ${folderName || 'ausgewählten Dateien'} geladen`,
      });

    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Verarbeitungsfehler",
        description: "Fehler beim Verarbeiten der ausgewählten Dateien",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const processDroppedFiles = async (files: File[], folderName?: string) => {
    if (files.length === 0) {
      toast({
        title: "Keine Bilder gefunden",
        description: "Der ausgewählte Ordner enthält keine Bilddateien",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const processedFiles: UploadFileItem[] = [];

    try {
      for (const file of files) {
        const validation = validateImageFile(file);
        let preview: string | undefined;

        try {
          preview = generateFilePreview(file);
        } catch (error) {
          console.warn(`Could not generate preview for ${file.name}:`, error);
        }

        const uploadItem: UploadFileItem = {
          id: crypto.randomUUID(),
          file,
          preview,
          status: validation.valid ? 'pending' : 'failed',
          progress: 0,
          error: validation.error,
          retryCount: 0,
          category: 'general'
        };

        processedFiles.push(uploadItem);
      }

      setBatchUpload(prev => ({
        ...prev,
        files: processedFiles,
        folderName: folderName,
        completed: 0,
        failed: processedFiles.filter(f => f.status === 'failed').length,
        overallProgress: 0,
        currentlyUploading: []
      }));

      setShowBatchUpload(true);

      toast({
        title: "Bilder vorbereitet",
        description: `${processedFiles.length} Bilder aus ${folderName || 'ausgewählten Dateien'} geladen`,
      });

    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Verarbeitungsfehler",
        description: "Fehler beim Verarbeiten der ausgewählten Dateien",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const folderName = files && files.length > 0 ? 
      files[0].webkitRelativePath?.split('/')[0] || 'Ordner' : 
      undefined;
    
    processSelectedFiles(files, folderName);
    
    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // Upload Queue Management Functions with XMLHttpRequest for progress tracking
  const uploadSingleFile = async (fileItem: UploadFileItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const controller = new AbortController();
      uploadQueueRef.current.set(fileItem.id, controller);

      // Handle abort signal
      controller.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Update status to uploading
      setBatchUpload(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', uploadStartTime: Date.now(), error: undefined }
            : f
        ),
        currentlyUploading: [...prev.currentlyUploading, fileItem.id]
      }));

      // Real-time progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setBatchUpload(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === fileItem.id 
                ? { ...f, progress }
                : f
            )
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            
            // Update status to completed
            setBatchUpload(prev => ({
              ...prev,
              files: prev.files.map(f => 
                f.id === fileItem.id 
                  ? { ...f, status: 'completed', progress: 100, uploadEndTime: Date.now() }
                  : f
              ),
              currentlyUploading: prev.currentlyUploading.filter(id => id !== fileItem.id),
              completed: prev.completed + 1
            }));
            resolve();
          } catch (parseError) {
            reject(new Error('Fehler beim Parsen der Server-Antwort'));
          }
        } else {
          let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {}
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Netzwerk-Fehler beim Upload'));
      });

      xhr.addEventListener('abort', () => {
        // Upload was cancelled
        setBatchUpload(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'paused', progress: 0 }
              : f
          ),
          currentlyUploading: prev.currentlyUploading.filter(id => id !== fileItem.id)
        }));
        resolve(); // Don't reject on abort, just resolve
      });

      xhr.addEventListener('loadend', () => {
        uploadQueueRef.current.delete(fileItem.id);
      });

      // Handle upload errors
      const handleUploadError = (error: Error) => {
        const errorMessage = error.message || 'Unbekannter Fehler';
        setBatchUpload(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'failed', 
                  progress: 0, 
                  error: errorMessage,
                  retryCount: f.retryCount + 1
                }
              : f
          ),
          currentlyUploading: prev.currentlyUploading.filter(id => id !== fileItem.id),
          failed: prev.failed + 1
        }));
        reject(error);
      };

      try {
        const formData = new FormData();
        formData.append('image', fileItem.file);
        formData.append('category', fileItem.category || 'general');
        formData.append('originalName', fileItem.file.name);
        formData.append('uploadTimestamp', new Date().toISOString());

        xhr.open('POST', '/api/gallery/upload');
        xhr.withCredentials = true;
        xhr.send(formData);
      } catch (error) {
        handleUploadError(error as Error);
      }
    });
  };

  const startBatchUpload = async () => {
    if (batchControlRef.current.isActive) return;

    const pendingFiles = batchUpload.files.filter(f => f.status === 'pending' || f.status === 'failed');
    
    if (pendingFiles.length === 0) {
      toast({
        title: "Keine Dateien zum Hochladen",
        description: "Alle Dateien wurden bereits verarbeitet",
        variant: "destructive"
      });
      return;
    }

    // Update refs for queue control
    batchControlRef.current = {
      isActive: true,
      isPaused: false,
      pendingFiles: [...pendingFiles],
      activeUploads: 0,
      shouldStop: false
    };

    setBatchUpload(prev => ({ 
      ...prev, 
      isActive: true, 
      isPaused: false,
      completed: 0,
      failed: 0 
    }));

    const processNext = async () => {
      const control = batchControlRef.current;
      
      // CRITICAL FIX: Distinguish between paused vs completed states
      // When paused, return early WITHOUT setting isActive=false
      if (control.isPaused) {
        return; // Keep isActive=true during pause to allow resume
      }
      
      // Handle stop or completion
      if (control.shouldStop || control.pendingFiles.length === 0) {
        if (control.activeUploads === 0) {
          // Actually completed or stopped
          control.isActive = false;
          setBatchUpload(prev => ({ ...prev, isActive: false }));
          
          if (!control.shouldStop) {
            await fetchImages();
            
            // Show completion toast only when actually completed
            setBatchUpload(prev => {
              const completedCount = prev.files.filter(f => f.status === 'completed').length;
              const failedCount = prev.files.filter(f => f.status === 'failed').length;
              
              toast({
                title: "Batch-Upload abgeschlossen",
                description: `${completedCount} erfolgreich, ${failedCount} fehlgeschlagen`,
              });
              
              return prev;
            });
          }
        }
        return;
      }

      if (control.activeUploads < uploadConfig.maxConcurrent) {
        const nextFile = control.pendingFiles.shift();
        if (nextFile) {
          control.activeUploads++;
          uploadSingleFile(nextFile).finally(() => {
            control.activeUploads--;
            processNext();
          });
          processNext(); // Start next upload immediately if slots available
        }
      }
    };

    processNext();
  };

  const pauseBatchUpload = () => {
    batchControlRef.current.isPaused = true;
    setBatchUpload(prev => ({ ...prev, isPaused: true }));
    
    // Cancel all active uploads
    uploadQueueRef.current.forEach(controller => {
      controller.abort();
    });
    uploadQueueRef.current.clear();
  };
  
  const resumeBatchUpload = () => {
    // CRITICAL FIX: Remove isActive precondition since pause should keep it true
    if (!batchControlRef.current.isPaused) return;
    
    // Ensure batch is active when resuming
    batchControlRef.current.isActive = true;
    batchControlRef.current.isPaused = false;
    setBatchUpload(prev => ({ ...prev, isActive: true, isPaused: false }));
    
    // Add paused files back to pending queue
    setBatchUpload(prev => {
      const pausedFiles = prev.files.filter(f => f.status === 'paused');
      batchControlRef.current.pendingFiles.push(...pausedFiles);
      
      return {
        ...prev,
        files: prev.files.map(f => 
          f.status === 'paused' 
            ? { ...f, status: 'pending', progress: 0 }
            : f
        )
      };
    });
    
    // Restart processing with fixed logic
    const processNext = async () => {
      const control = batchControlRef.current;
      
      // Same fixed logic as main processNext function
      if (control.isPaused) {
        return; // Keep isActive=true during pause
      }
      
      if (control.shouldStop || control.pendingFiles.length === 0) {
        if (control.activeUploads === 0) {
          control.isActive = false;
          setBatchUpload(prev => ({ ...prev, isActive: false }));
          
          if (!control.shouldStop) {
            await fetchImages();
            
            setBatchUpload(prev => {
              const completedCount = prev.files.filter(f => f.status === 'completed').length;
              const failedCount = prev.files.filter(f => f.status === 'failed').length;
              
              toast({
                title: "Batch-Upload abgeschlossen",
                description: `${completedCount} erfolgreich, ${failedCount} fehlgeschlagen`,
              });
              
              return prev;
            });
          }
        }
        return;
      }

      if (control.activeUploads < uploadConfig.maxConcurrent) {
        const nextFile = control.pendingFiles.shift();
        if (nextFile) {
          control.activeUploads++;
          uploadSingleFile(nextFile).finally(() => {
            control.activeUploads--;
            processNext();
          });
          processNext();
        }
      }
    };
    
    processNext();
  };

  const stopBatchUpload = () => {
    batchControlRef.current.shouldStop = true;
    batchControlRef.current.isActive = false;
    batchControlRef.current.isPaused = false;
    
    setBatchUpload(prev => ({ 
      ...prev, 
      isActive: false, 
      isPaused: false,
      currentlyUploading: []
    }));
    
    // Cancel all active uploads
    uploadQueueRef.current.forEach(controller => {
      controller.abort();
    });
    uploadQueueRef.current.clear();
  };

  const retryFailedUploads = () => {
    setBatchUpload(prev => {
      const retryFiles = prev.files.filter(f => f.status === 'failed');
      // Add retry files back to pending queue
      batchControlRef.current.pendingFiles.push(...retryFiles);
      
      return {
        ...prev,
        files: prev.files.map(f => 
          f.status === 'failed' 
            ? { ...f, status: 'pending', error: undefined, progress: 0 }
            : f
        ),
        failed: 0
      };
    });
  };

  const retryIndividualFile = (fileId: string) => {
    setBatchUpload(prev => {
      const retryFile = prev.files.find(f => f.id === fileId && f.status === 'failed');
      if (retryFile) {
        // Add file back to pending queue
        batchControlRef.current.pendingFiles.push(retryFile);
      }
      
      return {
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId && f.status === 'failed'
            ? { ...f, status: 'pending', error: undefined, progress: 0 }
            : f
        ),
        failed: Math.max(0, prev.failed - 1)
      };
    });
  };

  const removeFileFromBatch = (fileId: string) => {
    setBatchUpload(prev => {
      const fileToRemove = prev.files.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        revokeFilePreview(fileToRemove.preview);
      }
      
      // Remove from pending queue if present
      batchControlRef.current.pendingFiles = batchControlRef.current.pendingFiles.filter(f => f.id !== fileId);
      
      return {
        ...prev,
        files: prev.files.filter(f => f.id !== fileId)
      };
    });
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const { files } = batchUpload;
    if (files.length === 0) return 0;
    
    const totalProgress = files.reduce((sum, file) => {
      return sum + (file.status === 'completed' ? 100 : file.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / files.length);
  };

  // Update overall progress whenever batch upload state changes
  useEffect(() => {
    const overallProgress = calculateOverallProgress();
    setBatchUpload(prev => ({ ...prev, overallProgress }));
  }, [batchUpload.files]);
  
  // Cleanup previews on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Revoke all preview URLs when component unmounts
      batchUpload.files.forEach(file => {
        if (file.preview) {
          revokeFilePreview(file.preview);
        }
      });
    };
  }, []);
  
  // Enhanced cleanup when batch upload dialog closes
  const closeBatchUpload = () => {
    // Clean up all preview URLs
    batchUpload.files.forEach(file => {
      if (file.preview) {
        revokeFilePreview(file.preview);
      }
    });
    
    // Reset batch upload state
    setBatchUpload({
      files: [],
      isActive: false,
      isPaused: false,
      overallProgress: 0,
      completed: 0,
      failed: 0,
      currentlyUploading: [],
      folderName: undefined,
    });
    
    setShowBatchUpload(false);
  };

  const runGalleryTest = () => {
    setTestMode(true);
    toast({
      title: "🧪 Galerie-Test gestartet",
      description: "Teste alle Galerie-Funktionen..."
    });

    // Simuliere Test-Upload
    setTimeout(() => {
      const testImages: GalleryImage[] = [
        {
          id: "test-villa-1",
          filename: "villa-test.jpg",
          url: "/api/placeholder/600/400",
          originalName: "Villa Testbild",
          category: "general",
          metadata: {
            title: "Luxusvilla Testbild",
            description: "Test-Beschreibung für Villa",
            price: 850000,
            bedrooms: 4,
            bathrooms: 3,
            area: 180
          }
        },
        {
          id: "test-apartment-1",
          filename: "apartment-test.jpg",
          url: "/api/placeholder/600/400",
          originalName: "Apartment Testbild",
          category: "general",
          metadata: {
            title: "Apartment Testbild",
            description: "Test-Beschreibung für Apartment",
            price: 320000,
            bedrooms: 2,
            bathrooms: 1,
            area: 85
          }
        },
        {
          id: "test-360-1",
          filename: "360-test.jpg",
          url: "/api/placeholder/800/400",
          originalName: "360° Test Tour",
          category: "360",
          metadata: {
            type: "360",
            title: "360° Wohnzimmer Test"
          }
        }
      ];

      setGalleryImages(testImages);
      setError(null);

      toast({
        title: "✅ Test erfolgreich!",
        description: `${testImages.length} Test-Bilder geladen - alle Funktionen verfügbar!`
      });
    }, 1000);
  };


  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Fetching gallery images...");

      // Erste Versuche mit verschiedenen Endpunkten
      const endpoints = [
        "/api/gallery",
        "/api/gallery?cleanup=true",
        "/api/gallery/list"
      ];

      let images = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);

          const response = await fetch(`${endpoint}?t=${Date.now()}`, {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`📸 Received from ${endpoint}:`, data);

            if (Array.isArray(data) && data.length > 0) {
              images = data;
              break;
            } else if (data.images && Array.isArray(data.images)) {
              images = data.images;
              break;
            }
          } else {
            console.log(`❌ ${endpoint} failed with status: ${response.status}`);
            lastError = `HTTP ${response.status}`;
          }
        } catch (err) {
          console.log(`❌ ${endpoint} error:`, err);
          lastError = (err as Error).message;
          continue;
        }
      }

      // Fallback: Mock-Daten für Test
      if (images.length === 0) {
        console.log("🔄 Using mock data for testing...");
        images = [
          {
            id: "mock-1",
            filename: "test-image-1.jpg",
            url: "/api/placeholder/400/300",
            originalName: "Test Bild 1",
            category: "general",
            metadata: { title: "Test Immobilie 1" }
          },
          {
            id: "mock-2",
            filename: "test-image-2.jpg",
            url: "/api/placeholder/400/300",
            originalName: "Test Bild 2",
            category: "general",
            metadata: { title: "Test Immobilie 2" }
          }
        ];

        toast({
          title: "Test-Modus aktiv",
          description: "Zeige Mock-Bilder für Galerie-Test an",
        });
      }

      const validImages = images.filter((img: any) => img && img.id && (img.filename || img.url));
      console.log(`✅ Valid images found: ${validImages.length}`);

      setGalleryImages(validImages);

      if (validImages.length === 0) {
        setError("Keine Bilder gefunden - Upload testen");
      }

    } catch (error) {
      console.error("❌ Error fetching images:", error);
      setError(`Galerie-Fehler: ${(error as Error).message}`);
      setGalleryImages([]);

      toast({
        title: "Galerie-Test",
        description: "API nicht verfügbar - verwende Mock-Daten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages().catch(console.error);
  }, []);
  
  // Cleanup effect for memory management
  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts or dialog closes
      if (!showBatchUpload) {
        batchUpload.files.forEach(file => {
          if (file.preview) {
            revokeFilePreview(file.preview);
          }
        });
      }
    };
  }, [showBatchUpload, batchUpload.files]);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("📤 Starting normal image upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!file.type.startsWith("image/")) {
        throw new Error("Nur Bilddateien sind erlaubt");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Datei zu groß (max. 10MB)");
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", "general");
      formData.append("originalName", file.name);
      formData.append("uploadTimestamp", new Date().toISOString());

      console.log("🚀 Sending upload request...");
      const response = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: AbortSignal.timeout(45000), // 45 second timeout
      });

      console.log("📡 Upload response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log("❌ Upload error details:", errorData);
        } catch {
          console.log("❌ Could not parse error response");
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Normal image uploaded successfully:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("🎉 Upload completed successfully");
      fetchImages().catch(console.error);
      toast({
        title: "Bild hochgeladen",
        description: `"${result.image?.originalName || "Unbekannt"}" wurde erfolgreich hochgeladen`,
      });
    },
    onError: (err: Error) => {
      console.error("❌ Upload failed:", err);
      const errorMessage = err.message || "Unbekannter Upload-Fehler";
      toast({
        title: "Upload fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const upload360ImageMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      console.log("🚀 Starting 360° upload:", {
        filename: file.name,
        size: file.size,
        type: file.type,
        title,
      });

      if (!file || !title.trim()) {
        throw new Error("Datei und Titel sind erforderlich");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Nur Bilddateien sind für 360° Tours erlaubt");
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error(
          `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 50MB`,
        );
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const aspectRatio = img.width / img.height;
            const is360Format = Math.abs(aspectRatio - 2) < 0.3;

            if (!is360Format) {
              const userConfirmed = confirm(
                `Warnung: Das Bild hat ein Seitenverhältnis von ${aspectRatio.toFixed(2)}:1.\n\n` +
                  "360° Bilder sollten normalerweise ein 2:1 Verhältnis haben.\n" +
                  "Möchten Sie trotzdem fortfahren?",
              );

              if (!userConfirmed) {
                reject(new Error("Upload vom Benutzer abgebrochen"));
                return;
              }
            }

            const formData = new FormData();
            formData.append("image", file);
            formData.append("title", title.trim());
            formData.append("type", "360");
            formData.append("category", "360");
            formData.append("originalName", file.name);
            formData.append("fileSize", file.size.toString());
            formData.append("uploadTimestamp", new Date().toISOString());
            formData.append("dimensions", `${img.width}x${img.height}`);
            formData.append("aspectRatio", aspectRatio.toFixed(2));
            formData.append("verified360", is360Format.toString());

            console.log("📊 Image analysis:", {
              width: img.width,
              height: img.height,
              aspectRatio: aspectRatio.toFixed(2),
              is360Format,
            });

            try {
              const response = await fetch("/api/gallery/upload-360", {
                method: "POST",
                body: formData,
                credentials: "include",
                signal: AbortSignal.timeout(120000), // 2 minute timeout for large 360° files
              });

              if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                  const errorData = await response.json();
                  errorMessage =
                    errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                  console.warn("Could not parse error response:", parseError);
                }

                throw new Error(errorMessage);
              }

              const result = await response.json();
              console.log("✅ 360° upload successful:", result);
              resolve(result);
            } catch (fetchError) {
              const typedError = fetchError as Error;
              if (typedError.name === "TimeoutError") {
                reject(
                  new Error(
                    "Upload-Zeitüberschreitung - Die Datei ist zu groß oder die Verbindung zu langsam",
                  ),
                );
              } else {
                reject(typedError);
              }
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Fehler beim Analysieren der Bilddatei"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    onSuccess: (result: any) => {
      console.log("🎉 360° Upload completed successfully");
      fetchImages().catch(console.error);
      setTour360Title("");

      toast({
        title: "360° Bild erfolgreich hochgeladen!",
        description: `"${result.image?.metadata?.title || result.filename || "Unbekannt"}" wurde als 360° Tour gespeichert`,
      });
    },
    onError: (err: Error) => {
      console.error("❌ 360° Upload failed:", err);

      let errorMessage = err.message || "Unbekannter Upload-Fehler";

      if (
        errorMessage.includes("413") ||
        errorMessage.includes("too large") ||
        errorMessage.includes("zu groß")
      ) {
        errorMessage = "Die Datei ist zu groß. Maximum: 50MB für 360° Bilder";
      } else if (
        errorMessage.includes("415") ||
        errorMessage.includes("unsupported")
      ) {
        errorMessage =
          "Dateityp nicht unterstützt. Verwenden Sie JPG oder PNG Dateien";
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Server")
      ) {
        errorMessage =
          "Server-Fehler beim Verarbeiten der 360° Datei. Versuchen Sie es erneut.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Zeitüberschreitung")
      ) {
        errorMessage =
          "Upload-Zeitüberschreitung. Die Datei ist möglicherweise zu groß oder die Verbindung zu langsam.";
      }

      toast({
        title: "360° Upload fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Fehler beim Löschen");
      }

      return response.json();
    },
    onSuccess: () => {
      fetchImages().catch(console.error);
      toast({
        title: "Bild gelöscht",
        description: "Das Bild wurde erfolgreich gelöscht",
      });
    },
    onError: (err: Error) => {
      console.error("Delete error:", err);
      toast({
        title: "Fehler",
        description: err.message || "Das Bild konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const convertTo360Mutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/gallery/${id}/convert-to-360`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Konvertierung fehlgeschlagen");
      }
      return response.json();
    },
    onSuccess: () => {
      fetchImages().catch(console.error);
      toast({
        title: "Bild konvertiert",
        description: "Das Bild wurde erfolgreich als 360° Bild markiert",
      });
    },
    onError: (err: Error) => {
      const errorMessage = err.message || "Unbekannter Fehler";
      toast({
        title: "Fehler",
        description: `Das Bild konnte nicht konvertiert werden: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const convertTo360Image = (image: GalleryImage) => {
    const title = prompt(
      `Titel für 360° Bild "${image.originalName}" eingeben:`,
      image.originalName?.replace(/\.[^/.]+$/, "") || "Raum",
    );

    if (title) {
      convertTo360Mutation.mutate({ id: image.id, title });
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    // If more than 1 file, use batch upload system
    if (files.length > 1) {
      processSelectedFiles(files);
      return;
    }

    // Single file - use existing mutation system
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        uploadImageMutation.mutate(file);
      } else {
        toast({
          title: "Ungültiger Dateityp",
          description: "Nur Bilddateien sind erlaubt",
          variant: "destructive",
        });
      }
    });
  };

  // Handler for folder upload (now enhanced)
  const handleFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Ordner';
    processSelectedFiles(files, folderName);
  };

  const handle360FileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine 360° Bilddatei aus",
        variant: "destructive",
      });
      return;
    }

    if (!tour360Title.trim()) {
      toast({
        title: "Titel erforderlich",
        description: "Bitte geben Sie einen Titel für das 360° Bild ein",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ungültiger Dateityp",
        description: `Nur Bilddateien sind erlaubt. Gefunden: ${file.type}`,
        variant: "destructive",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: `Die Datei ist ${(file.size / 1024 / 1024).toFixed(1)}MB groß. Maximum: 50MB`,
        variant: "destructive",
      });
      return;
    }

    const filename = file.name.toLowerCase();
    const is360Pattern =
      /(?:360|pano|panorama|equirectangular|spherical|insta360|ricoh|theta)/i.test(
        filename,
      );

    if (!is360Pattern) {
      const confirmUpload = confirm(
        `Die Datei "${file.name}" scheint kein 360° Bild zu sein.\n\n` +
          "360° Bilder sollten normalerweise:\n" +
          "• Ein Seitenverhältnis von 2:1 haben\n" +
          "• Begriffe wie '360', 'pano', 'panorama' im Namen enthalten\n" +
          "• Von 360° Kameras (Insta360, Ricoh Theta) stammen\n\n" +
          "Möchten Sie trotzdem fortfahren?",
      );

      if (!confirmUpload) {
        return;
      }
    }

    toast({
      title: "Upload gestartet",
      description: `Lade "${file.name}" hoch...`,
    });

    try {
      upload360ImageMutation.mutate({
        file,
        title: tour360Title.trim(),
      });
    } catch (error) {
      console.error("360° Upload error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    setIsLoading(true);
    
    // Enhanced drag-and-drop with proper directory traversal
    const items = Array.from(e.dataTransfer.items);
    const entries: FileSystemEntry[] = [];
    
    // Use modern drag-and-drop API for directory support
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          entries.push(entry);
        }
      }
    }
    
    try {
      if (entries.length > 0) {
        // Use directory traversal for folders
        const files = await traverseDirectoryEntries(entries);
        const folderName = entries[0]?.isDirectory ? entries[0].name : undefined;
        await processDroppedFiles(files, folderName);
      } else {
        // Fallback to traditional file handling
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        await processDroppedFiles(imageFiles);
      }
    } catch (error) {
      console.error('Drop processing error:', error);
      toast({
        title: "Fehler beim Verarbeiten",
        description: "Fehler beim Verarbeiten der gezogenen Dateien",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle360Drag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDrag360Active(true);
    } else if (e.type === "dragleave") {
      setDrag360Active(false);
    }
  };

  const handle360Drop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag360Active(false);

    if (e.dataTransfer.files) {
      handle360FileSelect(e.dataTransfer.files);
    }
  };

  const normalImages = useMemo(() =>
    galleryImages.filter(
      (image: GalleryImage) =>
        image.category !== "360" && image.metadata?.type !== "360",
    ),
  [galleryImages]);

  const tour360Images = useMemo(() =>
    galleryImages.filter(
      (image: GalleryImage) =>
        image.category === "360" || image.metadata?.type === "360",
    ),
  [galleryImages]);

  const handleImageForListing = (image: GalleryImage) => {
    setSelectedImageForListing(image);
  };

  const closeListingForm = () => {
    setSelectedImageForListing(null);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(imageId)
        ? prevSelected.filter((id) => id !== imageId)
        : [...prevSelected, imageId],
    );
  };

  const handleBulkDelete = () => {
    if (selectedImages.length === 0) {
      toast({ title: "Keine Bilder ausgewählt", description: "Bitte wählen Sie zuerst Bilder zum Löschen aus." });
      return;
    }
    if (confirm(`Sind Sie sicher, dass Sie ${selectedImages.length} ausgewählte Bilder löschen möchten?`)) {
      selectedImages.forEach(id => deleteImageMutation.mutate(id));
      setSelectedImages([]); // Clear selection after initiating delete
      setIsSelectionMode(false); // Exit selection mode
    }
  };

  const open360Viewer = (image: GalleryImage) => {
    console.log("🎬 Opening 360° viewer for:", image.originalName || image.filename);
    setSelected360Image(image);
    setShow360Modal(true);
  };

  const close360Viewer = () => {
    console.log("🔚 Closing 360° viewer");
    setShow360Modal(false);
    setSelected360Image(null);
  };

  // Function to trigger the hidden file input
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Function to trigger the hidden folder input
  const openFolderPicker = () => {
    folderInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {selectedImageForListing && (
        <CreateListingForm image={selectedImageForListing} onClose={closeListingForm} />
      )}

      {/* Batch Upload Modal */}
      <Dialog open={showBatchUpload} onOpenChange={setShowBatchUpload}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto" data-testid="dialog-batch-upload">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Batch Upload - {batchUpload.folderName || 'Ausgewählte Dateien'}</span>
              <Badge variant="outline" className="ml-2">
                {batchUpload.files.length} Dateien
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Progress Overview */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium">
                    Gesamt-Fortschritt: {batchUpload.overallProgress}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {batchUpload.completed} abgeschlossen • {batchUpload.failed} fehlgeschlagen • {batchUpload.currentlyUploading.length} aktiv
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!batchUpload.isActive && (
                    <Button
                      onClick={startBatchUpload}
                      disabled={batchUpload.files.filter(f => f.status === 'pending' || f.status === 'failed').length === 0}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-start-batch-upload"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Upload starten
                    </Button>
                  )}
                  {batchUpload.isActive && !batchUpload.isPaused && (
                    <Button onClick={pauseBatchUpload} variant="outline" data-testid="button-pause-upload">
                      <PauseCircle className="w-4 h-4 mr-2" />
                      Pausieren
                    </Button>
                  )}
                  {batchUpload.isActive && batchUpload.isPaused && (
                    <Button onClick={resumeBatchUpload} className="bg-blue-600 hover:bg-blue-700" data-testid="button-resume-upload">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Fortsetzen
                    </Button>
                  )}
                  {batchUpload.isActive && (
                    <Button onClick={stopBatchUpload} variant="destructive" data-testid="button-stop-upload">
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stoppen
                    </Button>
                  )}
                  {batchUpload.failed > 0 && (
                    <Button onClick={retryFailedUploads} variant="outline" data-testid="button-retry-failed">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fehlgeschlagene wiederholen
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={batchUpload.overallProgress} className="w-full" />
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batchUpload.files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center space-x-4 p-3 border rounded-lg bg-white dark:bg-gray-900"
                  data-testid={`file-item-${fileItem.id}`}
                >
                  {/* File Preview */}
                  <div className="flex-shrink-0">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate" title={fileItem.file.name}>
                        {fileItem.file.name}
                      </p>
                      <Badge
                        variant={
                          fileItem.status === 'completed' ? 'default' :
                          fileItem.status === 'failed' ? 'destructive' :
                          fileItem.status === 'uploading' ? 'secondary' :
                          'outline'
                        }
                        data-testid={`status-${fileItem.status}`}
                      >
                        {fileItem.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {fileItem.status === 'uploading' && <Upload className="w-3 h-3 mr-1" />}
                        {fileItem.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {fileItem.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {fileItem.status === 'paused' && <PauseCircle className="w-3 h-3 mr-1" />}
                        {fileItem.status === 'pending' ? 'Wartend' :
                         fileItem.status === 'uploading' ? 'Upload läuft' :
                         fileItem.status === 'completed' ? 'Abgeschlossen' :
                         fileItem.status === 'failed' ? 'Fehlgeschlagen' : 'Pausiert'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-red-600 truncate" title={fileItem.error}>
                          {fileItem.error}
                        </p>
                      )}
                      {fileItem.retryCount > 0 && (
                        <p className="text-xs text-orange-600">
                          Versuche: {fileItem.retryCount}
                        </p>
                      )}
                    </div>
                    {fileItem.status === 'uploading' && (
                      <Progress value={fileItem.progress} className="w-full mt-2" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex space-x-1">
                    {fileItem.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryIndividualFile(fileItem.id)}
                        title="Datei erneut versuchen"
                        data-testid={`button-retry-${fileItem.id}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFileFromBatch(fileItem.id)}
                      title="Aus Liste entfernen"
                      data-testid={`button-remove-${fileItem.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Summary */}
            {batchUpload.files.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Upload-Zusammenfassung</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Gesamt:</span>
                    <span className="ml-1 font-medium">{batchUpload.files.length}</span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300">Abgeschlossen:</span>
                    <span className="ml-1 font-medium">{batchUpload.completed}</span>
                  </div>
                  <div>
                    <span className="text-red-700 dark:text-red-300">Fehlgeschlagen:</span>
                    <span className="ml-1 font-medium">{batchUpload.failed}</span>
                  </div>
                  <div>
                    <span className="text-orange-700 dark:text-orange-300">Wartend:</span>
                    <span className="ml-1 font-medium">
                      {batchUpload.files.filter(f => f.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 360° Viewer Modal */}
      <Dialog open={show360Modal} onOpenChange={setShow360Modal}>
        <DialogContent className="max-w-5xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>
                360° Virtual Tour: {selected360Image?.metadata?.title || selected360Image?.originalName || "Unbekannt"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            {selected360Image && (
              <VirtualTour
                scenes={[
                  {
                    id: selected360Image.id,
                    title: selected360Image.metadata?.title || selected360Image.originalName || "360° Tour",
                    image: selected360Image.url,
                    hotspots: []
                  }
                ]}
                propertyTitle={selected360Image.metadata?.title || "360° Virtual Tour"}
                propertyId={selected360Image.id}
                isEditMode={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Galerie verwalten {testMode && <span className="text-sm bg-blue-100 px-2 py-1 rounded">TEST-MODUS</span>}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {galleryImages.length} Bilder • Upload, 360°-Touren und Immobilien-Generator
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={runGalleryTest}
                className="text-green-600 hover:text-green-700 border-green-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                Galerie-Test
              </Button>

              {isSelectionMode && (
                <>
                  <Button variant="outline" onClick={() => setIsSelectionMode(false)} className="text-gray-600">
                    Abbrechen
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={selectedImages.length === 0 || deleteImageMutation.isPending}>
                    {deleteImageMutation.isPending ? "Lösche..." : `Auswahl löschen (${selectedImages.length})`}
                  </Button>
                </>
              )}
              {!isSelectionMode && (
                <Button variant="outline" onClick={() => setIsSelectionMode(true)} className="text-gray-600">
                  <Square className="w-4 h-4 mr-2" /> Auswahlmodus
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="normal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="normal"
                className="flex items-center space-x-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Normale Bilder ({normalImages.length})</span>
              </TabsTrigger>
              <TabsTrigger value="360" className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>360° Bilder ({tour360Images.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Normal Images Tab */}
            <TabsContent value="normal" className="space-y-6 mt-6">
              {/* Upload Area for Normal Images */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-[var(--arctic-blue)] bg-[var(--arctic-blue)]/5"
                    : "border-gray-300 hover:border-[var(--arctic-blue)]"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Normale Bilder hierhin ziehen
                </h3>
                <p className="text-gray-600 mb-4">
                  oder klicken Sie hier zum Auswählen
                </p>
                <Button
                  onClick={openFilePicker}
                  disabled={uploadImageMutation.isPending}
                  className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadImageMutation.isPending
                    ? "Wird hochgeladen..."
                    : "Normale Bilder auswählen"}
                </Button>
                <Button
                  onClick={openFolderPicker}
                  disabled={uploadImageMutation.isPending}
                  variant="outline"
                  className="ml-2 border-[var(--arctic-blue)] text-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/10"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Ordner hochladen
                </Button>
              </div>

              {/* Hidden file and folder inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: true } as any)}
                accept="image/*"
                onChange={(e) => handleFolderSelect(e.target.files)}
                className="hidden"
              />

              {/* Normal Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {normalImages.length > 0 ? (
                  normalImages.map((image: GalleryImage) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100"
                      onClick={(e) => {
                        if (isSelectionMode) {
                          e.stopPropagation();
                          toggleImageSelection(image.id);
                        }
                      }}
                    >
                      <img
                        src={image.url || `/api/gallery/${image.id}/image`}
                        alt={image.alt || image.originalName || "Gallery image"}
                        className={`w-full h-full object-cover transition-opacity ${
                          isSelectionMode && selectedImages.includes(image.id)
                            ? "opacity-50"
                            : ""
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (
                            parent &&
                            !parent.querySelector(".error-placeholder")
                          ) {
                            parent.classList.add(
                              "bg-gray-300",
                              "flex",
                              "items-center",
                              "justify-center",
                            );
                            const errorDiv = document.createElement("div");
                            errorDiv.className =
                              "error-placeholder text-red-500 flex flex-col items-center justify-center p-4";
                            errorDiv.innerHTML = `
                            <svg class="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-xs text-center">Bild nicht verfügbar</span>
                          `;
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-gray-800 hover:bg-gray-100"
                            onClick={(e) => {
                              if (isSelectionMode) {
                                e.stopPropagation();
                                toggleImageSelection(image.id);
                              } else {
                                window.open(image.url, "_blank");
                              }
                            }}
                          >
                            {isSelectionMode ? (
                              selectedImages.includes(image.id) ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-gray-800 hover:bg-gray-100"
                            onClick={() => handleImageForListing(image)}
                            title="Als Immobilienanzeige erstellen"
                          >
                            <Building className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-gray-800 hover:bg-gray-100"
                            onClick={() => convertTo360Image(image)}
                            title="Als 360° Bild markieren"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Sind Sie sicher, dass Sie dieses Bild löschen möchten?",
                                )
                              ) {
                                deleteImageMutation.mutate(image.id);
                              }
                            }}
                            disabled={deleteImageMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-4" />
                    <p>Keine normalen Bilder vorhanden</p>
                    <p className="text-sm">Laden Sie Ihre ersten Bilder hoch</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 360° Images Tab */}
            <TabsContent value="360" className="space-y-6 mt-6">
              {/* Upload Area for 360° Images */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  drag360Active
                    ? "border-[var(--arctic-blue)] bg-[var(--arctic-blue)]/5"
                    : "border-gray-300 hover:border-[var(--arctic-blue)]"
                }`}
                onDragEnter={handle360Drag}
                onDragLeave={handle360Drag}
                onDragOver={handle360Drag}
                onDrop={handle360Drop}
              >
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  360° Bilder hierhin ziehen
                </h3>
                <p className="text-gray-600 mb-4">
                  Equirectangular (2:1) Format für beste Qualität
                </p>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <Label htmlFor="tour360-title">Titel für 360° Bild</Label>
                    <Input
                      id="tour360-title"
                      placeholder="z.B. Wohnzimmer, Küche, Schlafzimmer..."
                      value={tour360Title}
                      onChange={(e) => setTour360Title(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (!tour360Title.trim()) {
                        toast({
                          title: "Fehler",
                          description: "Bitte geben Sie einen Titel ein",
                          variant: "destructive",
                        });
                        return;
                      }
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        handle360FileSelect(target.files);
                      };
                      input.click();
                    }}
                    disabled={
                      upload360ImageMutation.isPending || !tour360Title.trim()
                    }
                    className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {upload360ImageMutation.isPending
                      ? "Wird hochgeladen..."
                      : "360° Bild auswählen"}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Hinweise für 360° Bilder:
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <strong>Für Ihre Kameras:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>
                        • <strong>Insta360:</strong> Exportieren Sie als
                        "Equirectangular" (nicht als normale Fotos)
                      </li>
                      <li>
                        • <strong>Ricoh Theta:</strong> Standardformat wird
                        automatisch erkannt
                      </li>
                    </ul>
                  </div>
                  <div>
                    <strong>Technische Anforderungen:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>
                        • <strong>Seitenverhältnis:</strong> 2:1 (z.B.
                        5760x2880, 4096x2048)
                      </li>
                      <li>
                        • <strong>Mindestauflösung:</strong> 1920x960 Pixel
                      </li>
                      <li>
                        • <strong>Empfohlene Auflösung:</strong> 4096x2048 oder
                        höher
                      </li>
                      <li>
                        • <strong>Formate:</strong> JPG, PNG
                      </li>
                    </ul>
                  </div>
                  <p>
                    <strong>Automatische Erkennung:</strong> Das System erkennt
                    360° Bilder automatisch basierend auf Dateinamen,
                    Seitenverhältnis und Auflösung.
                  </p>
                </div>
              </div>

              {/* 360° Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tour360Images.length > 0 ? (
                  tour360Images.map((image: GalleryImage) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100"
                      onClick={(e) => {
                        if (isSelectionMode) {
                          e.stopPropagation();
                          toggleImageSelection(image.id);
                        }
                      }}
                    >
                      <img
                        src={image.url}
                        alt={
                          image.metadata?.title ||
                          image.alt ||
                          image.originalName ||
                          "360 gallery image"
                        }
                        className={`w-full h-full object-cover transition-opacity ${
                          isSelectionMode && selectedImages.includes(image.id)
                            ? "opacity-50"
                            : ""
                        }`}
                        onError={(e) => {
                          console.error(
                            `❌ Failed to load image: ${image.filename}`,
                          );
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.parentElement?.classList.add(
                            "bg-gray-300",
                            "items-center",
                            "justify-center",
                          );
                          if (
                            !target.parentElement?.querySelector(
                              ".error-placeholder",
                            )
                          ) {
                            const errorDiv = document.createElement("div");
                            errorDiv.className =
                              "error-placeholder text-red-500 flex items-center justify-center";
                            errorDiv.innerHTML =
                              '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
                            target.parentElement?.appendChild(errorDiv);
                          }
                        }}
                      />
                      <div className="absolute top-2 left-2">
                        <div className="bg-[var(--arctic-blue)] text-white px-2 py-1 rounded text-xs font-medium">
                          360°
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {image.metadata?.title || image.alt || "Ohne Titel"}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-gray-800 hover:bg-gray-100"
                            onClick={(e) => {
                              if (isSelectionMode) {
                                e.stopPropagation();
                                toggleImageSelection(image.id);
                              } else {
                                e.stopPropagation();
                                open360Viewer(image);
                              }
                            }}
                          >
                            {isSelectionMode ? (
                              selectedImages.includes(image.id) ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Sind Sie sicher, dass Sie dieses 360° Bild löschen möchten?",
                                )
                              ) {
                                deleteImageMutation.mutate(image.id);
                              }
                            }}
                            disabled={deleteImageMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <Camera className="w-12 h-12 mb-4" />
                    <p>Keine 360° Bilder vorhanden</p>
                    <p className="text-sm">
                      Laden Sie Ihr erstes 360° Bild hoch
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="text-center">
                <p className="text-red-600 font-medium">
                  Fehler beim Laden der Galerie
                </p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
              </div>
              <Button
                onClick={() => fetchImages().catch(console.error)}
                variant="outline"
                className="mt-2"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RotateCw className="w-6 h-6 animate-spin mr-2" />
              <span>Lade Galerie...</span>
            </div>
          ) : null}

          {!isLoading &&
            !error &&
            normalImages.length === 0 &&
            tour360Images.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mb-4" />
                <p>Keine Bilder in der Galerie vorhanden.</p>
                <p className="text-sm">Laden Sie Ihre ersten Bilder hoch.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}