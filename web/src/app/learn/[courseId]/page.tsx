"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProgress } from "@/lib/progress";
import type { CourseConfig } from "@/lib/types";

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const res = await fetch(`/api/course/${params.courseId}`);
      if (!res.ok) { router.replace("/"); return; }
      const config: CourseConfig = await res.json();
      if (!config.chapters[0]?.sections[0]) { router.replace("/"); return; }

      const allSections = config.chapters.flatMap((c) =>
        c.sections.map((s) => ({ ...s, chapterId: c.id }))
      );

      const progress = getProgress();
      const courseProgress = progress[params.courseId] as import("@/lib/types").CourseProgress | undefined;
      const completed = new Set(courseProgress?.completedSections ?? []);

      let target = allSections[0];
      for (let i = 0; i < allSections.length; i++) {
        const locked = i > 0 && !completed.has(allSections[i - 1].id);
        if (!locked && !completed.has(allSections[i].id)) {
          target = allSections[i];
          break;
        }
      }

      router.replace(`/learn/${params.courseId}/${target.chapterId}/${target.id}`);
    }
    redirect();
  }, [params.courseId, router]);

  return null;
}
