"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { SearchIcon } from "@/modules/prs/components/search-icon";

const DEBOUNCE_MS = 300;

interface Props {
  onDebouncedChange: (query: string) => void;
}

export function PrSearchBar({ onDebouncedChange }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isSearching = query !== debouncedQuery;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    onDebouncedChange(debouncedQuery);
  }, [debouncedQuery, onDebouncedChange]);

  function expand() {
    setIsExpanded(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function collapseIfEmpty() {
    if (query.trim() === "") {
      setIsExpanded(false);
    }
  }

  function handleContainerClick() {
    if (!isExpanded) {
      expand();
    }
  }

  function handleTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (isExpanded && query.trim() === "") {
      setIsExpanded(false);
      inputRef.current?.blur();
      return;
    }
    if (!isExpanded) {
      expand();
    }
  }

  return (
    <div
      className={`pr-search-bar ml-auto${isExpanded ? " is-expanded" : ""}`}
      onClick={handleContainerClick}
      role="search"
    >
      <button
        aria-controls={inputId}
        aria-expanded={isExpanded}
        aria-label={isSearching ? "Buscando PRs" : "Buscar PRs"}
        className="pr-search-bar__trigger"
        onClick={handleTriggerClick}
        type="button"
      >
        {isSearching ? <span aria-hidden="true" className="search-spinner" /> : <SearchIcon />}
      </button>
      <input
        ref={inputRef}
        aria-label="Filtrar PRs carregadas"
        className="pr-search-bar__input"
        id={inputId}
        onBlur={collapseIfEmpty}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            setDebouncedQuery("");
            setIsExpanded(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Buscar PRs..."
        tabIndex={isExpanded ? 0 : -1}
        type="search"
        value={query}
      />
    </div>
  );
}
