import { NextResponse } from "next/server";
import { fetchWeatherForecast } from "@/modules/prs/lib/core/open-meteo-weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Coordenadas invalidas." }, { status: 400 });
  }

  try {
    const forecast = await fetchWeatherForecast({ latitude, longitude });
    return NextResponse.json(forecast);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao buscar previsao do tempo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
