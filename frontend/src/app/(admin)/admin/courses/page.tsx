'use client';

import { useEffect, useState } from 'react';
import { getCourses, Course } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';

function isValidUrl(url: string) {
  return url?.startsWith('http://') || url?.startsWith('https://') || url?.startsWith('/');
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Course deleted');
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('foreign key') || msg.includes('constraint')) {
        toast.error('Cannot delete — this course has enrolled students.');
      } else {
        toast.error(msg || 'Failed to delete course');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your courses</p>
        </div>
        <Link href="/admin/courses/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Course</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No courses yet.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Course</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Discount</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded bg-muted shrink-0 overflow-hidden">
                        {isValidUrl(course.thumbnail) ? (
                          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <span className="font-medium line-clamp-1">{course.title}</span>
                    </div>
                  </td>
                  <td className="p-4">${course.price}</td>
                  <td className="p-4">{course.discount > 0 ? `${course.discount}%` : '—'}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => deleteCourse(course.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
