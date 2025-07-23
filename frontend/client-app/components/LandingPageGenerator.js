import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { LoadingSpinner } from '@shared/components/ui/loading-spinner';
import { Badge } from '@shared/components/ui/badge';
import { Progress } from '@shared/components/ui/progress';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Sparkles, Wand2, Eye, Code, Download, Copy, Check, ChevronDown, Bot, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PreviewModal from './PreviewModal';
import CodeEditor from './CodeEditor';

export default function LandingPageGenerator({ onPageGenerated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    businessType: '',
    targetAudience: '',
    callToAction: ''
  });
  
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedPage, setGeneratedPage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [error, setError] = useState(null);

  const models = [
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      description: 'Fast and reliable',
      icon: <Zap className="h-4 w-4" />
    },
    { 
      id: 'kimi', 
      name: 'Kimi (Moonshot)', 
      description: 'Advanced reasoning',
      icon: <Bot className="h-4 w-4" />
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.prompt.trim()) {
      setError('Please provide a description for your landing page');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Please provide a title for your landing page');
      return false;
    }
    return true;
  };

  const simulateProgress = () => {
    const steps = [
      { progress: 20, step: 'Processing your prompt...' },
      { progress: 40, step: 'Generating AI content...' },
      { progress: 60, step: 'Creating HTML structure...' },
      { progress: 80, step: 'Styling with CSS...' },
      { progress: 95, step: 'Adding interactivity...' },
      { progress: 100, step: 'Finalizing your page...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setGenerationProgress(steps[currentStep].progress);
        setGenerationStep(steps[currentStep].step);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return interval;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Initializing...');
    setError(null);

    const progressInterval = simulateProgress();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          title: formData.title,
          businessType: formData.businessType,
          targetAudience: formData.targetAudience,
          callToAction: formData.callToAction,
          model: selectedModel
        })
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate landing page');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStep('Complete!');
      
      setGeneratedPage(result.data);
      
      // Call parent callback if provided
      if (onPageGenerated) {
        onPageGenerated(result.data);
      }

      // Reset form
      setFormData({
        title: '',
        prompt: '',
        businessType: '',
        targetAudience: '',
        callToAction: ''
      });

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Generation error:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationStep('');
      }, 2000);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleEditCode = () => {
    setShowCodeEditor(true);
  };

  const handleCodeSave = async (updatedCode) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/landing-pages/${generatedPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          generatedCode: updatedCode
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPage(prev => ({
          ...prev,
          generatedCode: updatedCode
        }));
        setShowCodeEditor(false);
      } else {
        throw new Error(result.error?.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Landing Page Generator
          </CardTitle>
          <CardDescription>
            Describe your landing page and let AI create it for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={isGenerating}>
                  <div className="flex items-center gap-2">
                    {models.find(m => m.id === selectedModel)?.icon}
                    <span>{models.find(m => m.id === selectedModel)?.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {models.find(m => m.id === selectedModel)?.description}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {model.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="h-4 w-4 ml-auto text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Page Title *</label>
            <Input
              placeholder="e.g., Revolutionary SaaS Product Launch"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Main Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe Your Landing Page *</label>
            <Textarea
              placeholder="Describe what your landing page should be about, its purpose, key features, and any specific requirements..."
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type</label>
              <Input
                placeholder="e.g., SaaS, E-commerce, Agency"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Input
                placeholder="e.g., Small business owners, Developers"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Call to Action</label>
            <Input
              placeholder="e.g., Start Free Trial, Get Started, Learn More"
              value={formData.callToAction}
              onChange={(e) => handleInputChange('callToAction', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-medium">{generationStep}</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take 30-60 seconds...
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Landing Page
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Page Result */}
      {generatedPage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Page Generated Successfully!
              </span>
              <Badge variant="secondary">
                {generatedPage.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {generatedPage.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Page Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Model:</span>
                <p className="font-medium">{generatedPage.aiMetadata?.model || 'Kimi K2'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Processing Time:</span>
                <p className="font-medium">{generatedPage.aiMetadata?.processingTime || 'N/A'}s</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tokens:</span>
                <p className="font-medium">
                  {generatedPage.aiMetadata?.tokens?.total_tokens || 
                   (typeof generatedPage.aiMetadata?.tokens === 'object' ? 
                    JSON.stringify(generatedPage.aiMetadata.tokens) : 
                    generatedPage.aiMetadata?.tokens) || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {new Date(generatedPage.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleEditCode} variant="outline">
                <Code className="h-4 w-4 mr-2" />
                Edit Code
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && generatedPage && (
        <PreviewModal
          page={generatedPage}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Code Editor Modal */}
      {showCodeEditor && generatedPage && (
        <CodeEditor
          page={generatedPage}
          isOpen={showCodeEditor}
          onClose={() => setShowCodeEditor(false)}
          onSave={handleCodeSave}
        />
      )}
    </div>
  );
}