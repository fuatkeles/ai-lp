import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import LandingPageGenerator from '../components/LandingPageGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { ArrowLeft, Sparkles, Zap, Eye, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/router';

export default function GeneratePage() {
  const router = useRouter();
  const [generatedPages, setGeneratedPages] = useState([]);

  const handlePageGenerated = (newPage) => {
    setGeneratedPages(prev => [newPage, ...prev]);
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToDashboard}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">AI Landing Page Generator</h1>
              </div>
              <p className="text-muted-foreground">
                Create professional landing pages with AI assistance
              </p>
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced AI creates unique designs
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Fast Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get results in under 60 seconds
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    See and edit your page instantly
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Generator */}
          <LandingPageGenerator onPageGenerated={handlePageGenerated} />

          {/* Recent Generations */}
          {generatedPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Generations
                </CardTitle>
                <CardDescription>
                  Pages generated in this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedPages.map((page, index) => (
                    <div 
                      key={page.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{page.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Generated {new Date(page.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {page.aiMetadata?.processingTime || 'N/A'}s
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1 text-sm">
                <li>• Be specific about your business type and target audience</li>
                <li>• Include key features or benefits you want to highlight</li>
                <li>• Mention your preferred call-to-action</li>
                <li>• Describe the tone and style you want (professional, friendly, etc.)</li>
                <li>• Include any specific colors or branding preferences</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}