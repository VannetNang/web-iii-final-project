"use client";
import { useEffect, useState } from "react";
import { getMyCourses, Enrolment } from "@/lib/enrolments";
import { CourseCardSkeleton } from "@/components/courses/CourseCardSkeleton";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

function isValidUrl(url: string) {
  return (
    url?.startsWith("http://") ||
    url?.startsWith("https://") ||
    url?.startsWith("/")
  );
}

const statusVariant: Record<
  Enrolment["status"],
  "default" | "secondary" | "destructive"
> = {
  success: "default",
  pending: "secondary",
  cancelled: "destructive",
};

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses()
      .then(setEnrolments)
      .catch(() => toast.error("Failed to load your courses"))
      .finally(() => setLoading(false));
  }, []);

  const active = enrolments.filter((e) => e.status === "success");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-1">
          {loading
            ? ""
            : `${active.length} course${active.length !== 1 ? "s" : ""} enrolled`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            You haven't enrolled in any courses yet.
          </p>
          <Link href="/courses" className="text-primary underline text-sm">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {active.map((enrolment) => {
            const course = enrolment.course;
            const thumbnail = isValidUrl(course.thumbnail)
              ? course.thumbnail
              : null;
            const progressPct = Number(enrolment.progress ?? 0);
            const firstLessonId = course.lessons?.[0]?.id;
            const card = (
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                onClick={() =>
                  router.push(`/learn/${course.id}/${firstLessonId}`)
                }
              >
                <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 right-2"
                    variant={statusVariant[enrolment.status]}
                  >
                    {enrolment.status}
                  </Badge>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {course.description}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2">
                  <div className="flex justify-between w-full text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="w-full h-2" />
                </CardFooter>
              </Card>
            );

            return firstLessonId ? (
              <Link
                key={enrolment.id}
                href={`/learn/${course.id}/${firstLessonId}`}
              >
                {card}
              </Link>
            ) : (
              <div
                key={enrolment.id}
                className="opacity-60 cursor-not-allowed"
                title="No lessons yet"
              >
                {card}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
