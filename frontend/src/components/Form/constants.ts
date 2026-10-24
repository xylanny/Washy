import type { InjectionKey } from "vue";
import type { FormContext, FormItemContext } from "./types";

export const formContextKey: InjectionKey<FormContext> = Symbol("formContext");

export const formItemContextKey: InjectionKey<FormItemContext> =
  Symbol("formItemContext");
