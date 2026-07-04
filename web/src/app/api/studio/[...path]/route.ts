// Unlike the read-only routes, generateStaticParams must NOT be exported here in
// normal builds: it marks the route static and Next then 405s every non-GET method.
// Demo builds (static export, CI deletes api/ anyway) get a static no-op GET only.
const isDemo = process.env.NEXT_PUBLIC_DEMO === "true";
export const dynamic = isDemo ? "force-static" : "force-dynamic";
export const generateStaticParams = isDemo ? () => [] : undefined;

import { NextResponse } from "next/server";
import {
  StudioError,
  readDoc,
  writeDoc,
  createModule,
  deleteModule,
  deleteSection,
  deleteChapter,
  deleteRecap,
  saveCourseImage,
  type ModuleType,
} from "@/lib/studio-fs";

type Ctx = { params: { path: string[] } };

function handle(fn: () => Response | Promise<Response>): Response | Promise<Response> {
  try {
    return fn();
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown): Response {
  if (e instanceof StudioError) {
    return NextResponse.json(e.payload ?? { error: e.message }, { status: e.status });
  }
  if (e instanceof SyntaxError) {
    return NextResponse.json({ error: "Malformed JSON on disk or in request" }, { status: 500 });
  }
  throw e;
}

export async function GET(_req: Request, { params }: Ctx) {
  return handle(() => NextResponse.json(readDoc(params.path)));
}

export async function PUT(req: Request, { params }: Ctx) {
  const body = (await req.json()) as { data: unknown; expectedMtime: number | null };
  return handle(() =>
    NextResponse.json(writeDoc(params.path, body.data, body.expectedMtime ?? null))
  );
}

const MODULE_TYPES: ModuleType[] = ["course", "flashcards", "quizzes"];

export async function POST(req: Request, { params }: Ctx) {
  const p = params.path;

  if (p.length === 1 && p[0] === "create") {
    const body = (await req.json()) as { type: ModuleType; config: Record<string, unknown> };
    if (!MODULE_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Invalid module type" }, { status: 400 });
    }
    return handle(() => {
      createModule(body.type, body.config ?? {});
      return NextResponse.json({ ok: true }, { status: 201 });
    });
  }

  if (p.length === 3 && p[0] === "course" && p[2] === "image") {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    try {
      return NextResponse.json(await saveCourseImage(p[1], file));
    } catch (e) {
      return errorResponse(e);
    }
  }

  return NextResponse.json({ error: "Unknown endpoint" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const p = params.path;
  return handle(() => {
    if (p.length === 2 && MODULE_TYPES.includes(p[0] as ModuleType)) {
      deleteModule(p[0] as ModuleType, p[1]);
    } else if (p.length === 4 && p[0] === "course" && p[2] === "section") {
      deleteSection(p[1], p[3]);
    } else if (p.length === 4 && p[0] === "course" && p[2] === "chapter") {
      deleteChapter(p[1], p[3]);
    } else if (p.length === 4 && p[0] === "course" && p[2] === "recap") {
      deleteRecap(p[1], p[3]);
    } else {
      return NextResponse.json({ error: "Unknown endpoint" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
