import { getCourseSummaries, hasRecap } from "@/lib/courses";
import RecapIndexPage from "./_client";

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "true") return [];
  return getCourseSummaries()
    .filter((c) => hasRecap(c.id))
    .map((c) => ({ courseId: c.id }));
}

export default function Page({ params }: { params: { courseId: string } }) {
  return <RecapIndexPage />;
}
