import { getCourseSummaries, getRecapSectionIds } from "@/lib/courses";
import RecapSectionPage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getCourseSummaries().flatMap((course) =>
    getRecapSectionIds(course.id).map((sectionId) => ({
      courseId: course.id,
      sectionId,
    }))
  );
}

export default function Page({ params }: { params: { courseId: string; sectionId: string } }) {
  return <RecapSectionPage />;
}
