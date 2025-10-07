import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, fetchApi } from '@/lib/queryClient';
import type { SocialMediaPost, SocialMediaAccount, PublishRequest, Platform } from '../types/social-media.types';

export function useSocialMedia() {
  const queryClient = useQueryClient();

  // Fetch all posts
  const { data: posts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['/api/social-media/posts'],
    queryFn: () => fetchApi<SocialMediaPost[]>('/api/social-media/posts'),
  });

  // Fetch connected accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/social-media/accounts'],
    queryFn: () => fetchApi<SocialMediaAccount[]>('/api/social-media/accounts'),
  });

  // Publish post mutation
  const publishMutation = useMutation({
    mutationFn: async (request: PublishRequest) => {
      return apiRequest('/api/social-media/publish', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest(`/api/social-media/posts/${postId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
    },
  });

  // Update post mutation
  const updateMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: Partial<PublishRequest> }) => {
      return apiRequest(`/api/social-media/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
    },
  });

  // Disconnect account mutation
  const disconnectAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest(`/api/social-media/accounts/${accountId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/accounts'] });
    },
  });

  return {
    // Data
    posts,
    accounts,
    
    // Loading states
    isLoading: postsLoading || accountsLoading,
    postsLoading,
    accountsLoading,
    
    // Errors
    postsError,
    
    // Mutations
    publishPost: publishMutation.mutate,
    deletePost: deleteMutation.mutate,
    updatePost: updateMutation.mutate,
    disconnectAccount: disconnectAccountMutation.mutate,
    
    // Mutation states
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
    publishSuccess: publishMutation.isSuccess,
  };
}

export function useContentSchedule() {
  const queryClient = useQueryClient();

  const scheduleMutation = useMutation({
    mutationFn: async (request: PublishRequest) => {
      return apiRequest('/api/social-media/publish', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-media/posts'] });
    },
  });

  return {
    schedulePost: scheduleMutation.mutate,
    isScheduling: scheduleMutation.isPending,
    scheduleError: scheduleMutation.error,
    scheduleSuccess: scheduleMutation.isSuccess,
  };
}

export function usePlatformAuth() {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectPlatform = useCallback(async (platform: Platform) => {
    setIsConnecting(true);
    try {
      // Initiate OAuth flow
      const response = await apiRequest('/api/social-media/accounts/connect', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      });
      
      const { authUrl } = response;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect platform:', error);
      setIsConnecting(false);
    }
  }, []);

  return {
    connectPlatform,
    isConnecting,
  };
}
