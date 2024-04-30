/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

export interface CssSnippet {
    id: string;
    name: string;
    description: string;
    lastEdited: string;
    createdAt: string;
    origin: CssSnippetOrigin | null;
    enabled: boolean;
    css: string;
}

export type CssSnippetOrigin = "quickcss" | GenericCssSnippetOrigin;

export interface GenericCssSnippetOrigin {
    type: string;
}

export interface CssSnippets {
    enabled: boolean;
    list: CssSnippet[];
}


export let data: CssSnippets | undefined;

export async function getData() {
    if (data) return data;
    let loadedData = null;
    try {
        loadedData = JSON.parse(await VencordNative.cssSnippets.getRawData());
    } catch { }
    if (!loadedData) {
        data = {
            enabled: true,
            list: []
        };
        await writeData();
        return data;
    }
    data = loadedData;
    listeners.forEach(i => i());
    injectCssSnippets(data);
    return data;
}

export async function getSnippetList() {
    await getData();
    return data!.list;
}

export function sortSnippets(snippets: CssSnippet[]) {
    return [...snippets].sort((a, b) => new Date(a.lastEdited).getTime() - new Date(b.lastEdited).getTime()).reverse();
}

export async function isEnabled() {
    await getData();
    return data!.enabled;
}

export async function setEnabled(enabled: boolean) {
    await getData();
    data!.enabled = enabled;
    await writeData();
}

export async function writeData() {
    if (!data) return;
    data = { ...data }; // required for react
    listeners.forEach(i => i());
    injectCssSnippets(data);
    return await VencordNative.cssSnippets.setRawData(JSON.stringify(data, null, 4));
}

export async function getSnippetItem(id: string) {
    const snippets = await getSnippetList();
    return snippets.find(s => s.id === id);
}

export async function setSnippetItem(snippet: CssSnippet) {
    const snippets = [...await getSnippetList()];
    let i = snippets.findIndex(s => s.id === snippet.id);
    if (i < 0) i = snippets.length;
    snippets[i] = snippet;
    data!.list = snippets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).reverse();
    await writeData();
    return snippet;
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

export const listeners = new Set<() => void>();

export function useCssSnippets() {
    return React.useSyncExternalStore(cb => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    }, () => data);
}


export async function injectCssSnippets({ enabled, list: snippets }: CssSnippets) {
    const styles = Array.from(document.querySelectorAll("style.vc-css-snippet") as NodeListOf<HTMLStyleElement>);
    for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        const snippet = snippets.find(s => s.id === style.dataset.snippetId!);
        if (enabled && snippet?.enabled) {
            style.innerText = snippet.css;
            style.dataset.snippetName = snippet.name;
        } else {
            style.parentElement?.removeChild(style);
        }
    }
    const stylesUpdated = Array.from(document.querySelectorAll("style.vc-css-snippet") as NodeListOf<HTMLStyleElement>);
    for (let i = 0; i < snippets.length; i++) {
        const snippet = snippets[i];
        const hasElement = !!stylesUpdated.some(e => e.dataset.snippetId === snippet.id);
        if (hasElement || !enabled || !snippet?.enabled) continue;
        const style = document.createElement("style");
        style.classList.add("vc-css-snippet");
        style.dataset.snippetId = snippet.id;
        style.dataset.snippetName = snippet.name;
        style.innerText = snippet.css;
        document.documentElement.appendChild(style);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getData();
}, { once: true });
