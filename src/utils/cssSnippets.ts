/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface CssSnippet {
    id: string;
    name: string;
    description: string;
    lastEdited: string;
    enabled: boolean;
    css: string;
}

export interface CssSnippets {
    enabled: boolean;
    list: CssSnippet[];
}

export let data: CssSnippets | undefined;

export async function loadData() {
    if (data) return;
    data = await VencordNative.cssSnippets.getRawData();
}

export async function getSnippetList() {
    await loadData();
    return data!.list;
}

export async function isEnabled() {
    await loadData();
    return data!.enabled;
}

export async function setEnabled(enabled: boolean) {
    await loadData();
    data!.enabled = enabled;
    await writeData();
}

export async function writeData() {
    if (!data) return;
    return await VencordNative.cssSnippets.setRawData(data!);
}

export async function getSnippetItem(id: string) {
    const snippets = await getSnippetList();
    return snippets.find(s => s.id === id)!;
}

export async function setSnippetItem(snippet: CssSnippet) {
    const snippets = [...await getSnippetList()];
    const i = snippets.findIndex(s => s.id === snippet.id);
    if (i < 0) return;
    snippets[i] = snippet;
    data!.list = snippets;
    await writeData();
}

export async function deleteSnippet(id: string) {
    const snippets = [...await getSnippetList()];
    const i = snippets.findIndex(s => s.id === id);
    if (i < 0) return false;
    snippets.splice(i, 1);
    data!.list = snippets;
    await writeData();
    return true;
}
