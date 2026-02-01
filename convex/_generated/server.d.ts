/* eslint-disable */
/**
 * Generated Convex server types - placeholder file.
 *
 * Run `npx convex dev` to generate the actual types.
 */

import type {
  GenericMutationCtx,
  GenericQueryCtx,
  GenericActionCtx,
  FunctionReference,
  MutationBuilder,
  QueryBuilder,
  ActionBuilder,
  InternalMutationBuilder,
  InternalQueryBuilder,
  InternalActionBuilder,
  HttpActionBuilder,
} from "convex/server";
import type { DataModel } from "./dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export declare const query: QueryBuilder<DataModel, "public">;
export declare const mutation: MutationBuilder<DataModel, "public">;
export declare const action: ActionBuilder<DataModel, "public">;
export declare const internalQuery: InternalQueryBuilder<DataModel>;
export declare const internalMutation: InternalMutationBuilder<DataModel>;
export declare const internalAction: InternalActionBuilder<DataModel>;
export declare const httpAction: HttpActionBuilder;
