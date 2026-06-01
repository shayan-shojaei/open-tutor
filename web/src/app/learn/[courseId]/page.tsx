import { getCourseSummaries } from "@/lib/courses";
import CoursePage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getCourseSummaries().map((c) => ({ courseId: c.id }));
}

export default function Page({ params }: { params: { courseId: string } }) {
  return <CoursePage params={params} />;
}
