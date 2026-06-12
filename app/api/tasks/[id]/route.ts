import { NextResponse } from "next/server";
import { patchTaskById, removeTaskById } from "@/modules/tasks/lib/task-service";
import type { PatchTaskBody } from "@/modules/tasks/lib/task-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as PatchTaskBody;
  const result = await patchTaskById(id, body);

  if (!result.ok) {
    if (result.status === 400) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(result.task);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await removeTaskById(id);

  if (!result.ok) {
    return NextResponse.json({ message: "Task not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
