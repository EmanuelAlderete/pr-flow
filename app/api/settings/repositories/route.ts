import { NextResponse } from "next/server";
import {
  formatMonitoredRepositoryZodError,
  monitoredRepositoryCreateSchema
} from "@/modules/prs/lib/monitored-repository-validation";
import {
  getMonitoredRepositoryBySlug,
  insertMonitoredRepository,
  listMonitoredRepositories
} from "@/modules/prs/lib/monitored-repository-repository";
import { ensureMonitoredRepositoriesReady } from "@/modules/prs/lib/monitored-repositories-service";

export async function GET() {
  try {
    await ensureMonitoredRepositoriesReady();
    const repositories = await listMonitoredRepositories();
    return NextResponse.json({ repositories });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os repositórios." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = monitoredRepositoryCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: formatMonitoredRepositoryZodError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    await ensureMonitoredRepositoriesReady();
    const existing = await getMonitoredRepositoryBySlug(parsed.data.repository);
    if (existing) {
      return NextResponse.json({ error: "Repositório já cadastrado." }, { status: 409 });
    }

    const rows = await listMonitoredRepositories();
    const repository = await insertMonitoredRepository({
      repository: parsed.data.repository,
      defaultBranch: parsed.data.defaultBranch,
      sortOrder: parsed.data.sortOrder ?? rows.length
    });

    return NextResponse.json({ repository }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar o repositório." }, { status: 500 });
  }
}
