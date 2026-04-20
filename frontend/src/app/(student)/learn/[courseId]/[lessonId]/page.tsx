"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCourse, Course, Lesson } from "@/lib/courses";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function LearnPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const loadData = async () => {
      try {
        const [courseData, progressRes] = await Promise.all([
          getCourse(courseId),
          api
            .get(`/lessons/progress/${courseId}`)
            .catch(() => ({ data: { data: [] } })),
        ]);

        setCourse(courseData);

        // Find specific lesson from URL or default to the first one
        const lesson =
          courseData.lessons?.find((l: any) => l.id === lessonId) ??
          courseData.lessons?.[0];
        setCurrentLesson(lesson ?? null);

        const completedIds = Array.isArray(progressRes.data?.data)
          ? progressRes.data.data
          : [];
        setCompleted(new Set(completedIds));
      } catch (err) {
        console.error("Load Error:", err);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) loadData();
  }, [courseId, lessonId]);

  const markComplete = async (lesson: Lesson) => {
    if (completed.has(lesson.id)) return;
    try {
      await api.post("/lessons/progress", { lessonId: lesson.id, courseId });
      setCompleted((prev) => new Set([...prev, lesson.id]));
      toast.success("Lesson marked as complete!");
    } catch {
      toast.error("Failed to update progress");
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </aside>
        <main className="flex-1 p-6 space-y-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
        </main>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        Course content missing.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r overflow-y-auto shrink-0">
        <div className="p-4 border-b sticky top-0 bg-background z-10">
          <h2 className="font-bold text-sm line-clamp-2">{course.title}</h2>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              <span>
                {completed.size}/{course.lessons.length} Lessons
              </span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
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
                className="block"
              >
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all
                  ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                  ) : isActive ? (
                    <PlayCircle className="w-4 h-4 shrink-0 animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0" />
                  )}
                  <span
                    className={`line-clamp-2 ${isActive ? "font-semibold" : "font-medium"}`}
                  >
                    {index + 1}. {lesson.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Native Video Player for stability */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border">
            {isClient && currentLesson.videoUrl ? (
              <video
                key={currentLesson.videoUrl} // Crucial: forces reload when URL changes
                controls
                autoPlay={false}
                className="w-full h-full"
                controlsList="nodownload"
                onEnded={() => markComplete(currentLesson)}
                crossOrigin="anonymous" // Helps with CORS issues
              >
                <source src={currentLesson.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm">Initializing player...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">
                {currentLesson.title}
              </h1>
              {currentLesson.description && (
                <p className="text-muted-foreground text-lg max-w-2xl">
                  {currentLesson.description}
                </p>
              )}
            </div>
            <Button
              size="lg"
              variant={completed.has(currentLesson.id) ? "outline" : "default"}
              onClick={() => markComplete(currentLesson)}
              disabled={completed.has(currentLesson.id)}
              className="rounded-full px-8 shadow-md"
            >
              {completed.has(currentLesson.id) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                  Completed
                </>
              ) : (
                "Mark as Complete"
              )}
            </Button>
          </div>

          <Separator className="my-6" />

          {/* Bottom Navigation */}
          {(() => {
            const currentIndex = course.lessons.findIndex(
              (l) => l.id === currentLesson.id,
            );
            const nextLesson = course.lessons[currentIndex + 1];
            return (
              <div className="flex items-center justify-between pb-12">
                <div className="text-sm font-medium text-muted-foreground">
                  Lesson {currentIndex + 1} of {course.lessons.length}
                </div>
                {nextLesson ? (
                  <Link href={`/learn/${courseId}/${nextLesson.id}`}>
                    <Button variant="ghost" className="group">
                      Next: {nextLesson.title.substring(0, 20)}...
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <div className="text-sm font-bold text-primary italic">
                    🎉 Course Completed!
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
