import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { LoadingSpinner } from '@shared/components/ui/loading-spinner';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  ExternalLink, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function PreviewModal({ page, isOpen, onClose }) {
  const [viewMode, setViewMode] = useState('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen && page) {
      loadPreview();
    }
  }, [isOpen, page]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/landing-pages/${page.id}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load preview');
      }

      // Create blob URL for the HTML content
      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
    } catch (error) {
      console.error('Preview error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    loadPreview();
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getViewportClasses = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-[375px] h-[667px]';
      case 'tablet':
        return 'w-[768px] h-[1024px]';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  const getViewportLabel = () => {
    switch (viewMode) {
      case 'mobile':
        return 'Mobile (375px)';
      case 'tablet':
        return 'Tablet (768px)';
      case 'desktop':
      default:
        return 'Desktop';
    }
  };

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Preview: {page.title}
                <Badge variant="secondary">{page.status}</Badge>
              </DialogTitle>
              <DialogDescription>
                Live preview of your generated landing page
              </DialogDescription>
            </div>
            
            {/* Viewport Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tablet')}
                  className="h-8 w-8 p-0"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
          
          {/* Viewport Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Viewport: {getViewportLabel()}</span>
            <span>•</span>
            <span>Generated: {new Date(page.createdAt).toLocaleString()}</span>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <p className="font-medium text-destructive">Failed to load preview</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <div className="h-full flex justify-center">
              <div className={`${getViewportClasses()} border rounded-lg overflow-hidden bg-white shadow-lg`}>
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${page.title}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Page Info */}
        <div className="border-t p-4 bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Model: {page.aiMetadata?.model || 'Kimi K2'}
              </span>
              <span className="text-muted-foreground">
                Processing Time: {page.aiMetadata?.processingTime || 'N/A'}s
              </span>
              <span className="text-muted-foreground">
                Tokens: {page.aiMetadata?.tokens?.total_tokens || 
                        (typeof page.aiMetadata?.tokens === 'object' ? 
                         JSON.stringify(page.aiMetadata.tokens) : 
                         page.aiMetadata?.tokens) || 'N/A'}
              </span>
            </div>
            <div className="text-muted-foreground">
              ID: {page.id}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}