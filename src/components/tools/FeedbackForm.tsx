'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiPath } from '@/lib/utils';

interface FeedbackFormProps {
  toolName: string;
}

export function FeedbackForm({ toolName }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiPath('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      toast.success('感谢您的反馈！');
    } catch {
      toast.error('提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 sm:p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">感谢您的反馈！</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">这个工具有帮助吗？</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-0.5 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {rating > 0 && (
          <>
            <Textarea
              placeholder="可选：留下您的建议或评论..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                '提交中...'
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  提交反馈
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
