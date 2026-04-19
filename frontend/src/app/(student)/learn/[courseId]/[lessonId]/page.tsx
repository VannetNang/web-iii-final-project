'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCourse, Course, Lesson } from '@/lib/courses';
import { toast } from 'sonner';
import ReactPlayer from 'react-player/lazy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function LearnPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCourse(courseId),
      api.get(`/lessons/progress/${courseId}`).catch(() => ({ data: { data: [] } })),
    ]).then(([courseData, progressRes]) => {
      setCourse(courseData);
      const lesson = courseData.lessons?.find((l) => l.id === lessonId) ?? courseData.lessons?.[0];
      setCurrentLesson(lesson ?? null);

      const completedIds: string[] = progressRes.data.data ?? progressRes.data ?? [];
      setCompleted(new Set(completedIds));
    })
    .catch(() => toast.error('Failed to load course'))
    .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const markComplete = async (lesson: Lesson) => {
    if (completed.has(lesson.id)) return;
    try {
      await api.post('/lessons/progress', { lessonId: lesson.id, courseId });
      setCompleted((prev) => new Set([...prev, lesson.id]));
      toast.success('Lesson marked as complete!');
    } catch {
      toast.error('Failed to mark lesson complete');
    }
  };

  const progressPercent = course?.lessons?.length
    ? Math.round((completed.size / course.lessons.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        <aside className="w-72 border-r p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </aside>
        <main className="flex-1 p-6 space-y-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Course not found.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-72 border-r overflow-y-auto shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm line-clamp-2">{course.title}</h2>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completed.size}/{course.lessons.length} completed</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <div className="p-2 space-y-1">
          {course.lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLesson.id;
            const isDone = completed.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                href={`/learn/${courseId}/${lesson.id}`}
                onClick={() => setCurrentLesson(lesson)}
              >
                <div className={`flex items-center gap-3 p-3 rounded-lg text-sm cursor-pointer transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                    : isActive
                    ? <PlayCircle className="w-4 h-4 shrink-0" />
                    : <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />
                  }
                  <span className="line-clamp-2">{index + 1}. {lesson.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main video area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <ReactPlayer
              url={currentLesson.videoUrl}
              width="100%"
              height="100%"
              controls
              onEnded={() => markComplete(currentLesson)}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-muted-foreground mt-1">{currentLesson.description}</p>
              )}
            </div>
            <Button
              variant={completed.has(currentLesson.id) ? 'outline' : 'default'}
              onClick={() => markComplete(currentLesson)}
              disabled={completed.has(currentLesson.id)}
              className="shrink-0"
            >
              {completed.has(currentLesson.id) ? (
                <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />Completed</>
              ) : (
                'Mark as Complete'
              )}
            </Button>
          </div>

          <Separator />

          {(() => {
            const currentIndex = course.lessons.findIndex((l) => l.id === currentLesson.id);
            const nextLesson = course.lessons[currentIndex + 1];
            return nextLesson ? (
              <div className="flex justify-end">
                <Link href={`/learn/${courseId}/${nextLesson.id}`}>
                  <Button onClick={() => setCurrentLesson(nextLesson)}>Next Lesson →</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                🎉 You've reached the end of this course!
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
