"use client";

import { useMe } from "@/components/app/useMe";

export function Greeting() {
  const me = useMe();
  const first = me?.name?.split(/\s+/)[0];
  if (!first) return null;
  return <span className="text-brand">Bon retour, {first}.</span>;
}
