import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { LoadingSpinner } from '@shared/components/ui/loading-spinner';
import { 
  Code, 
  Save, 
  RotateCcw, 
  Eye, 
  Copy, 
  Check,
  AlertCircle,
  FileCode,
  Palette,
  Zap
} from 'lucide-react';

export default function CodeEditor({ page, isOpen, onClose, onSave }) {
  const [editedCode, setEditedCode] = useState({
    html: '',
    css: '',
    javascript: ''
  });
  const [activeTab, setActiveTab] = useState('html');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen && page) {
      setEditedCode({
        html: page.generatedCode.html || '',
        css: page.generatedCode.css || '',
        javascript: page.generatedCode.javascript || ''
      });
      setHasChanges(false);
      generatePreview(page.generatedCode);
    }
  }, [isOpen, page]);

  const generatePreview = (code) => {
    const { html, css, javascript } = code;
    
    let completeHTML = html;
    
    // Inject CSS if not already included
    if (css && !html.includes('<style>') && !html.includes('</style>')) {
      completeHTML = completeHTML.replace(
        '</head>',
        `    <style>\n${css}\n    </style>\n</head>`
      );
    }
    
    // Inject JavaScript if not already included
    if (javascript && !html.includes('<script>') && !html.includes('</script>')) {
      completeHTML = completeHTML.replace(
        '</body>',
        `    <script>\n${javascript}\n    </script>\n</body>`
      );
    }

    // Clean up previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new blob URL
    const blob = new Blob([completeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const handleCodeChange = (type, value) => {
    const newCode = {
      ...editedCode,
      [type]: value
    };
    
    setEditedCode(newCode);
    setHasChanges(true);
    
    // Update preview in real-time
    generatePreview(newCode);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedCode);
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (page) {
      setEditedCode({
        html: page.generatedCode.html || '',
        css: page.generatedCode.css || '',
        javascript: page.generatedCode.javascript || ''
      });
      setHasChanges(false);
      generatePreview(page.generatedCode);
    }
  };

  const handleCopy = async (type) => {
    try {
      await navigator.clipboard.writeText(editedCode[type]);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const getTabIcon = (type) => {
    switch (type) {
      case 'html':
        return <FileCode className="h-4 w-4" />;
      case 'css':
        return <Palette className="h-4 w-4" />;
      case 'javascript':
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getLineCount = (text) => {
    return text.split('\n').length;
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
                <Code className="h-5 w-5" />
                Edit Code: {page?.title}
                <Badge variant="secondary">{page?.status}</Badge>
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Unsaved Changes
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Edit the generated HTML, CSS, and JavaScript code
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Panel */}
          <div className="w-1/2 border-r flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b px-4 py-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    {getTabIcon('html')}
                    HTML
                    <Badge variant="secondary" className="text-xs">
                      {getLineCount(editedCode.html)}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex items-center gap-2">
                    {getTabIcon('css')}
                    CSS
                    <Badge variant="secondary" className="text-xs">
                      {getLineCount(editedCode.css)}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="javascript" className="flex items-center gap-2">
                    {getTabIcon('javascript')}
                    JavaScript
                    <Badge variant="secondary" className="text-xs">
                      {getLineCount(editedCode.javascript)}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="html" className="h-full m-0">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                      <span className="text-sm font-medium">HTML Structure</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('html')}
                      >
                        {copySuccess === 'html' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={editedCode.html}
                      onChange={(e) => handleCodeChange('html', e.target.value)}
                      className="flex-1 resize-none border-0 rounded-none font-mono text-sm"
                      placeholder="HTML code will appear here..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="css" className="h-full m-0">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                      <span className="text-sm font-medium">CSS Styles</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('css')}
                      >
                        {copySuccess === 'css' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={editedCode.css}
                      onChange={(e) => handleCodeChange('css', e.target.value)}
                      className="flex-1 resize-none border-0 rounded-none font-mono text-sm"
                      placeholder="CSS code will appear here..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="javascript" className="h-full m-0">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                      <span className="text-sm font-medium">JavaScript Functionality</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('javascript')}
                      >
                        {copySuccess === 'javascript' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={editedCode.javascript}
                      onChange={(e) => handleCodeChange('javascript', e.target.value)}
                      className="flex-1 resize-none border-0 rounded-none font-mono text-sm"
                      placeholder="JavaScript code will appear here..."
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="border-b p-2 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </span>
                <Badge variant="outline" className="text-xs">
                  Auto-updating
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                    <p>Preview not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Last saved: {new Date(page?.updatedAt || page?.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>Lines: HTML({getLineCount(editedCode.html)}), CSS({getLineCount(editedCode.css)}), JS({getLineCount(editedCode.javascript)})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}