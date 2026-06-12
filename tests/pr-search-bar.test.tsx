import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrSearchBar } from "@/modules/prs/components/pr-search-bar";

describe("PrSearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("expande ao clicar e aplica filtro com debounce de 300ms", () => {
    const onDebouncedChange = vi.fn();
    render(<PrSearchBar onDebouncedChange={onDebouncedChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Buscar PRs" }));
    expect(screen.getByRole("searchbox", { name: "Filtrar PRs carregadas" })).toBeInTheDocument();

    const input = screen.getByRole("searchbox", { name: "Filtrar PRs carregadas" });
    fireEvent.change(input, { target: { value: "feat" } });

    expect(screen.getByRole("button", { name: "Buscando PRs" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onDebouncedChange).not.toHaveBeenCalledWith("feat");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDebouncedChange).toHaveBeenCalledWith("feat");
    expect(screen.getByRole("button", { name: "Buscar PRs" })).toBeInTheDocument();
  });
});
