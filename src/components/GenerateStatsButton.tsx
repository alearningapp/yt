'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BarChart, Loader2 } from 'lucide-react';
import { generateAndSaveWeeklyStats, generateAndSaveMonthlyStats } from '@/lib/actions/channelHistory';

interface GenerateStatsButtonProps {
  channelId: string;
  onSuccess?: () => void;
}

export function GenerateStatsButton({ channelId, onSuccess }: GenerateStatsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateStats = async () => {
    setIsGenerating(true);
    try {
      // Generate both weekly and monthly stats
      await generateAndSaveWeeklyStats(channelId);
      await generateAndSaveMonthlyStats(channelId);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error generating stats:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateStats}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-indigo-500 text-white hover:bg-indigo-600"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BarChart className="w-4 h-4" />
      )}
      {isGenerating ? 'Generating...' : 'Generate Statistics'}
    </Button>
  );
}