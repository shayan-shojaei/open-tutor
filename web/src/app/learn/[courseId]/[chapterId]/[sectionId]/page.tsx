import { getCourseSummaries, getCourseConfig } from "@/lib/courses";
import SectionPage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getCourseSummaries().flatMap((course) => {
    const config = getCourseConfig(course.id);
    if (!config) return [];
    return config.chapters.flatMap((chapter) =>
      chapter.sections.map((section) => ({
        courseId: course.id,
        chapterId: chapter.id,
        sectionId: section.id,
      }))
    );
  });
}

export default function Page() {
  return <SectionPage />;
}
