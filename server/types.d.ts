export type ProfessionRankId = "none" | "novice" | "apprentice" | "adept" | "specialist" | "master";

export interface AlchemyIngredientEffect {
  readonly effectId: string;
  readonly effectKey: string;
  readonly name: string;
  readonly baseCost: number;
  readonly magnitude: number;
  readonly duration: number;
  readonly area: number;
  readonly hostile: boolean;
  readonly known: boolean;
  readonly keywords: readonly string[];
  readonly powerAffectsMagnitude: boolean;
  readonly powerAffectsDuration: boolean;
  readonly noMagnitude: boolean;
  readonly noDuration: boolean;
}

export interface AlchemyIngredientCatalogEntry {
  readonly definitionId: string;
  readonly stableFormKey: string;
  readonly name: string;
  readonly effects: readonly AlchemyIngredientEffect[];
}

export interface ServerContext {
  readonly userId: number;
  readonly actorId: number;
  readonly characterId: string;
  readonly sessionId: string;
  readonly expectedSessionId?: string;
}

export interface ProfessionPort {
  getCareer(ctx: ServerContext): Promise<{
    professionId: string | null;
    rank: ProfessionRankId | "expert";
    revision: number;
    vigor?: { current: number; max: number; regenPerMinute: number } | null;
  }>;
  authorizeActivity(ctx: ServerContext, input: {
    operationId: string;
    professionId: "alchemist";
    sourceSystem: "alchemy-system";
    requiredRank: ProfessionRankId;
    vigorCost: number;
    expectedXp: number;
  }): Promise<{ allowed: boolean; reason?: string | null }>;
  settleActivity(ctx: ServerContext, input: {
    operationId: string;
    terminal: "committed" | "cancelled";
    resultRef: string | null;
  }): Promise<void>;
}

export interface InventoryPort {
  getAlchemyInventory(ctx: ServerContext): Promise<{
    bottles: number;
    alchemySkill: number;
    fortifyPercent?: number;
    activePerks?: readonly string[];
    inventoryByDefId: Map<string, number>;
    catalogByDefId: Map<string, AlchemyIngredientCatalogEntry>;
  }>;
  commitAlchemy(ctx: ServerContext, input: {
    operationId: string;
    costs: Record<string, number>;
    bottleCost: number;
    product: {
      name: string;
      poison: boolean;
      outputCount: number;
      effects: readonly {
        effectKey: string;
        effectId: string;
        magnitude: number;
        duration: number;
        area: number;
      }[];
    };
  }): Promise<{ resultRef?: string }>;
}

export interface PerkGrant {
  readonly kind: "perk";
  readonly definition: { readonly stableFormKey: string };
  readonly source: { readonly kind: "PROFESSION"; readonly key: "alchemist"; readonly tier: ProfessionRankId };
}

export interface PerkDeliveryPort {
  projectProfessionGrants(ctx: ServerContext, grants: readonly PerkGrant[]): Promise<void>;
}
