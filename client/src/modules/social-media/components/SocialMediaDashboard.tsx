import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialMedia } from '../hooks/useSocialMedia';
import { Facebook, Instagram, Linkedin, Music, Plus, Calendar, BarChart } from 'lucide-react';
import type { Platform } from '../types/social-media.types';

const platformIcons: Record<Platform, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
};

const platformColors: Record<Platform, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
};

export function SocialMediaDashboard() {
  const { posts, accounts, isLoading } = useSocialMedia();
  const [selectedTab, setSelectedTab] = useState<'posts' | 'accounts' | 'analytics'>('posts');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Media Hub</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Social Media Präsenz zentral
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Post
        </Button>
      </div>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(platformIcons).map(([platform, Icon]) => {
          const account = accounts?.find(a => a.platform === platform as Platform);
          const isConnected = !!account;

          return (
            <Card key={platform}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {platform}
                </CardTitle>
                <Icon className={`h-4 w-4 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {isConnected ? (
                    <>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Verbunden
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {account.accountName}
                      </span>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full">
                      Verbinden
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setSelectedTab('posts')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'posts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="inline-block mr-2 h-4 w-4" />
          Posts
        </button>
        <button
          onClick={() => setSelectedTab('accounts')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'accounts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Accounts
        </button>
        <button
          onClick={() => setSelectedTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'analytics'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart className="inline-block mr-2 h-4 w-4" />
          Analytics
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'posts' && (
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map(post => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>{post.content.substring(0, 100)}...</CardDescription>
                    </div>
                    <Badge variant={
                      post.status === 'published' ? 'default' :
                      post.status === 'scheduled' ? 'secondary' :
                      post.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {post.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    {post.platforms.map(platform => {
                      const Icon = platformIcons[platform];
                      return (
                        <div
                          key={platform}
                          className={`flex items-center space-x-1 px-2 py-1 rounded text-white text-xs ${platformColors[platform]}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="capitalize">{platform}</span>
                        </div>
                      );
                    })}
                  </div>
                  {post.scheduledAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Geplant für: {new Date(post.scheduledAt).toLocaleString('de-DE')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Posts</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Erstellen Sie Ihren ersten Social Media Post
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Post erstellen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedTab === 'accounts' && (
        <div className="space-y-4">
          {accounts && accounts.length > 0 ? (
            accounts.map(account => (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {(() => {
                      const Icon = platformIcons[account.platform];
                      return <Icon className="mr-2 h-5 w-5" />;
                    })()}
                    {account.accountName}
                  </CardTitle>
                  <CardDescription>
                    {account.accountType} • Verbunden am {new Date(account.createdAt).toLocaleDateString('de-DE')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">Keine verbundenen Accounts</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Verbinden Sie Ihre Social Media Accounts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedTab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Übersicht über Ihre Social Media Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Analytics Dashboard wird implementiert...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
