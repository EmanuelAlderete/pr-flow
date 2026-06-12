import { NextResponse } from "next/server";
import {
  formatMonitoredRepositoryZodError,
  monitoredRepositoryUpdateSchema
} from "@/modules/prs/lib/monitored-repository-validation";
import {
  deleteMonitoredRepository,
  getMonitoredRepositoryById,
  getMonitoredRepositoryBySlug,
  updateMonitoredRepository
} from "@/modules/prs/lib/monitored-repository-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = monitoredRepositoryUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: formatMonitoredRepositoryZodError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const current = await getMonitoredRepositoryById(id);
    if (!current) {
      return NextResponse.json({ error: "Repositório não encontrado." }, { status: 404 });
    }

    if (parsed.data.repository && parsed.data.repository !== current.repository) {
      const duplicate = await getMonitoredRepositoryBySlug(parsed.data.repository);
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: "Repositório já cadastrado." }, { status: 409 });
      }
    }

    const repository = await updateMonitoredRepository(id, parsed.data);
    if (!repository) {
      return NextResponse.json({ error: "Repositório não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ repository });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o repositório." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const removed = await deleteMonitoredRepository(id);
    if (!removed) {
      return NextResponse.json({ error: "Repositório não encontrado." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover o repositório." }, { status: 500 });
  }
}
