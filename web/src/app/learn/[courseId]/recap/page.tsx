"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RecapIndexPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const res = await fetch(`/api/recap/${courseId}`);
      if (!res.ok) {
        router.replace(`/learn/${courseId}`);
        return;
      }
      const { hasRecap, sectionIds } = await res.json();
      if (!hasRecap || !sectionIds?.length) {
        router.replace(`/learn/${courseId}`);
      } else {
        router.replace(`/learn/${courseId}/recap/${sectionIds[0]}`);
      }
    }
    redirect();
  }, [courseId, router]);

  return (
    <div className="spinner-page">
      <div className="spinner" />
    </div>
  );
}
