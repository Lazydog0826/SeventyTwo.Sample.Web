// noinspection JSUnusedGlobalSymbols

import http from "@/utils/request";
import type { PageRequest, PageResponse } from "@/api/paging.ts";

export interface DataDictionaryListOutput {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enable: boolean;
  version: string;
  itemCount: number;
}

export interface DataDictionaryMutationInput {
  code: string;
  name: string;
  description: string | null;
  enable: boolean;
}

export interface DataDictionaryItemOutput {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
}

export interface DataDictionaryItemsOutput {
  dictionaryId: string;
  version: string;
  items: DataDictionaryItemOutput[];
}

export interface DataDictionaryItemMutationInput {
  dictionaryId: string;
  value: string;
  label: string;
  sortOrder: number;
  dictionaryVersion: string;
}

export interface DataDictionaryItemMutationOutput {
  dictionaryVersion: string;
  item: DataDictionaryItemOutput | null;
}

export interface DataDictionaryOptionOutput {
  value: string;
  label: string;
}

const basePath = "/api/dataDictionaries";

export function getDataDictionaryList(request: PageRequest) {
  return http.get<PageResponse<DataDictionaryListOutput>>(`${basePath}/list`, {
    searchParams: {
      index: request.index,
      limit: request.limit,
      keyword: request.keyword,
      enable: request.enable,
    },
  });
}

export function getDataDictionaryItems(id: string) {
  return http.get<DataDictionaryItemsOutput>(`${basePath}/${id}/items`);
}

export function createDataDictionary(input: DataDictionaryMutationInput) {
  return http.post<DataDictionaryListOutput>(`${basePath}/create`, { json: input });
}

export function updateDataDictionary(input: DataDictionaryMutationInput & { id: string; version: string }) {
  return http.post<void>(`${basePath}/update`, { json: input });
}

export function deleteDataDictionary(id: string) {
  return http.post<void>(`${basePath}/delete`, { json: { id } });
}

export function createDataDictionaryItem(input: DataDictionaryItemMutationInput) {
  return http.post<DataDictionaryItemMutationOutput>(`${basePath}/items/create`, { json: input });
}

export function updateDataDictionaryItem(input: DataDictionaryItemMutationInput & { id: string }) {
  return http.post<DataDictionaryItemMutationOutput>(`${basePath}/items/update`, { json: input });
}

export function deleteDataDictionaryItem(input: { dictionaryId: string; id: string; dictionaryVersion: string }) {
  return http.post<DataDictionaryItemMutationOutput>(`${basePath}/items/delete`, { json: input });
}

export function getDataDictionaryOptions(code: string) {
  return http.get<DataDictionaryOptionOutput[]>(`${basePath}/by-code/${encodeURIComponent(code)}/items`);
}
