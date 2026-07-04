export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "force-static" : "force-dynamic";
export function generateStaticParams() { return []; }

import CourseEditor from "./_client";

export default function Page({ params }: { params: { courseId: string } }) {
  return <CourseEditor courseId={params.courseId} />;
}
