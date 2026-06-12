import { NextResponse } from "next/server";
import { createTaskFromInput, getTaskLists } from "@/modules/tasks/lib/task-service";
import type { CreateTaskInput } from "@/modules/tasks/lib/task-validation";

export async function GET() {
  const lists = await getTaskLists();
  return NextResponse.json(lists);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateTaskInput;
  const result = await createTaskFromInput(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json(result.task, { status: 201 });
}
