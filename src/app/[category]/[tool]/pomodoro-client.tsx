'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type Phase = 'work' | 'break';

export function PomodoroClient() {
  const { t } = useI18n();

  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [phase, setPhase] = useState<Phase>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = phase === 'work' ? workDuration * 60 : breakDuration * 60;

  // Create a simple beep sound using Web Audio API
  const playNotification = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 600);
    } catch {
      // Audio not available
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playNotification();
      if (phase === 'work') {
        setCompletedPomodoros(prev => prev + 1);
        setPhase('break');
        setTimeLeft(breakDuration * 60);
      } else {
        setPhase('work');
        setTimeLeft(workDuration * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, phase, workDuration, breakDuration, playNotification]);

  const toggleTimer = () => setIsRunning(prev => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('work');
    setTimeLeft(workDuration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="mx-auto space-y-6">
      {/* Timer Display */}
      <Card className="bg-card border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2">
            {phase === 'work' ? (
              <Briefcase className="h-5 w-5 text-orange-500" />
            ) : (
              <Coffee className="h-5 w-5 text-green-500" />
            )}
            <span>{phase === 'work' ? t('pomodoro.work') : t('pomodoro.break')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="currentColor"
                className="text-muted/20"
                strokeWidth="8"
              />
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="currentColor"
                className={phase === 'work' ? 'text-orange-500' : 'text-green-500'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {t('pomodoro.completed')}: {completedPomodoros} 🍅
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            >
              {isRunning ? (
                <><Pause className="h-5 w-5 mr-2" /> {t('pomodoro.pause')}</>
              ) : (
                <><Play className="h-5 w-5 mr-2" /> {t('pomodoro.start')}</>
              )}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              <RotateCcw className="h-5 w-5 mr-2" /> {t('pomodoro.reset')}
            </Button>
            <Button
              onClick={() => setShowSettings(prev => !prev)}
              variant="outline"
              size="lg"
              className="px-3"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {showSettings && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('pomodoro.settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-duration">{t('pomodoro.work_duration')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="work-duration"
                    type="number"
                    min={1}
                    max={120}
                    value={workDuration}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                      setWorkDuration(val);
                      if (!isRunning && phase === 'work') setTimeLeft(val * 60);
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t('pomodoro.minutes')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="break-duration">{t('pomodoro.break_duration')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="break-duration"
                    type="number"
                    min={1}
                    max={60}
                    value={breakDuration}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                      setBreakDuration(val);
                      if (!isRunning && phase === 'break') setTimeLeft(val * 60);
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t('pomodoro.minutes')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
