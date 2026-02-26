"use client";

import { orgs } from "./mock-data";
import { Org } from "./types";

export function getAllOrgs(): Org[] {
  return orgs;
}

export function getOrgById(orgId: string): Org | undefined {
  return orgs.find((o) => o.id === orgId);
}
