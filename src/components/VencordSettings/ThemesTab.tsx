/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { CssSnippet, deleteSnippet, getData, getSnippetItem, setSnippetItem, sortSnippets, useCssSnippets } from "@api/CSSSnippets";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Flex } from "@components/Flex";
import { CogWheel, DeleteIcon } from "@components/Icons";
import { Link } from "@components/Link";
import PluginModal from "@components/PluginSettings/PluginModal";
import { Switch } from "@components/Switch";
import type { UserThemeHeader } from "@main/themes";
import { openInviteModal } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { showItemInFolder } from "@utils/native";
import { useAwaiter } from "@utils/react";
import { findByPropsLazy, findLazy } from "@webpack";
import { Button, Card, Forms, React, showToast, SnowflakeUtils, TabBar, Text, TextArea, TextInput, useEffect, useRef, useState } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";

import { AddonCard } from "./AddonCard";
import { SettingsTab, wrapTab } from "./shared";

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const InviteActions = findByPropsLazy("resolveInvite");
const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);
const TextAreaProps = findLazy(m => typeof m.textarea === "string");

const cl = classNameFactory("vc-settings-theme-");

function Validator({ link }: { link: string; }) {
    const [res, err, pending] = useAwaiter(() => fetch(link).then(res => {
        if (res.status > 300) throw `${res.status} ${res.statusText}`;
        const contentType = res.headers.get("Content-Type");
        if (!contentType?.startsWith("text/css") && !contentType?.startsWith("text/plain"))
            throw "Not a CSS file. Remember to use the raw link!";

        return "Okay!";
    }));

    const text = pending
        ? "Checking..."
        : err
            ? `Error: ${err instanceof Error ? err.message : String(err)}`
            : "Valid!";

    return <Forms.FormText style={{
        color: pending ? "var(--text-muted)" : err ? "var(--text-danger)" : "var(--text-positive)"
    }}>{text}</Forms.FormText>;
}

function Validators({ themeLinks }: { themeLinks: string[]; }) {
    if (!themeLinks.length) return null;

    return (
        <>
            <Forms.FormTitle className={Margins.top20} tag="h5">Validator</Forms.FormTitle>
            <Forms.FormText>This section will tell you whether your themes can successfully be loaded</Forms.FormText>
            <div>
                {themeLinks.map(link => (
                    <Card style={{
                        padding: ".5em",
                        marginBottom: ".5em",
                        marginTop: ".5em"
                    }} key={link}>
                        <Forms.FormTitle tag="h5" style={{
                            overflowWrap: "break-word"
                        }}>
                            {link}
                        </Forms.FormTitle>
                        <Validator link={link} />
                    </Card>
                ))}
            </div>
        </>
    );
}

interface ThemeCardProps {
    theme: UserThemeHeader;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    onDelete: () => void;
}

function ThemeCard({ theme, enabled, onChange, onDelete }: ThemeCardProps) {
    return (
        <AddonCard
            name={theme.name}
            description={theme.description}
            author={theme.author}
            lastEdited={theme.author}
            enabled={enabled}
            setEnabled={onChange}
            infoButton={
                IS_WEB && (
                    <div style={{ cursor: "pointer", color: "var(--status-danger" }} onClick={onDelete}>
                        <DeleteIcon />
                    </div>
                )
            }
            footer={
                <Flex flexDirection="row" style={{ gap: "0.2em" }}>
                    {!!theme.website && <Link href={theme.website}>Website</Link>}
                    {!!(theme.website && theme.invite) && " • "}
                    {!!theme.invite && (
                        <Link
                            href={`https://discord.gg/${theme.invite}`}
                            onClick={async e => {
                                e.preventDefault();
                                theme.invite != null && openInviteModal(theme.invite).catch(() => showToast("Invalid or expired invite"));
                            }}
                        >
                            Discord Server
                        </Link>
                    )}
                </Flex>
            }
        />
    );
}

function SnippetCard(snippet: CssSnippet) {
    return (
        <AddonCard
            name={snippet.name}
            description={snippet.description}
            lastEdited={new Date(snippet.lastEdited).toString()}
            enabled={snippet.enabled}
            setEnabled={enabled => setSnippetItem({ ...snippet, enabled })}
            infoButton={
                <div style={{ cursor: "pointer" }} onClick={() => openModal(modalProps =>
                    <SnippetModal modalProps={modalProps} snippet={snippet} />
                )}>
                    <CogWheel />
                </div>
            }
        />
    );
}

function SnippetModal({ modalProps, snippet, onApply, isNew }: { modalProps: ModalProps, snippet: CssSnippet; onApply?: () => void; isNew?: boolean; }) {
    const [enabled, setEnabled] = useState(snippet.enabled);
    const [name, setName] = useState(snippet.name);
    const [description, setDescription] = useState(snippet.description);
    const [css, setCss] = useState(snippet.css);
    const applySnippet = async () => {
        const currentSnippet: CssSnippet | {} = (await getSnippetItem(snippet.id)) || {};
        setSnippetItem({ ...snippet, ...currentSnippet, enabled, name, description, lastEdited: new Date().toISOString(), css });
        onApply && onApply();
    };
    return <ModalRoot {...modalProps} size={ModalSize.LARGE}>
        <ModalHeader>
            {/* style={{ margin: 0 }} */}
            <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>{isNew ? "Create New Snippet" : "Edit Snippet"}</Text>
            <Switch checked={enabled} onChange={v => setEnabled(v)} />
            <ModalCloseButton onClick={modalProps.onClose} />
        </ModalHeader>
        <ModalContent>
            <Forms.FormSection>
                <Forms.FormTitle>Name</Forms.FormTitle>
                <TextInput
                    type="text"
                    value={name}
                    onChange={v => setName(v)}
                    maxLength={120}
                />
                <Forms.FormTitle>Description</Forms.FormTitle>
                <TextArea
                    type="text"
                    value={description}
                    onChange={v => setDescription(v)}
                    rows={2}
                />
                <Forms.FormTitle>CSS</Forms.FormTitle>
                <TextArea
                    className={cl("snippet-editor")}
                    type="text"
                    value={css}
                    onChange={v => setCss(v)}
                    rows={15}
                    spellCheck={false}
                />
            </Forms.FormSection>
            {/* <Button style={{ width: "100%" }} onClick={() => VencordNative.cssSnippets.editSnippet(snippet.id)}>
                Open CSS Editor
            </Button> */}
        </ModalContent>
        <ModalFooter>
            <Flex>
                <Button color={Button.Colors.PRIMARY} onClick={async () => {
                    await applySnippet();
                }}>
                    Apply
                </Button>
                <Button onClick={async () => {
                    await applySnippet();
                    modalProps.onClose();
                }}>
                    Save Snippet
                </Button>
            </Flex>
            <Flex>
                <Button color={Button.Colors.RED} onClick={() => {
                    deleteSnippet(snippet.id);
                    modalProps.onClose();
                }}>
                    Delete Snippet
                </Button>
            </Flex>
        </ModalFooter>
    </ModalRoot>;
}

enum ThemeTab {
    CSS_SNIPPETS,
    LOCAL,
    ONLINE
}

function ThemesTab() {
    const settings = useSettings(["themeLinks", "enabledThemes"]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentTab, setCurrentTab] = useState(ThemeTab.CSS_SNIPPETS);
    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));
    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);
    const cssSnippets = useCssSnippets();
    const [themeDir, , themeDirPending] = useAwaiter(VencordNative.themes.getThemesDir);

    useEffect(() => {
        refreshLocalThemes();
        getData();
    }, []);

    async function refreshLocalThemes() {
        const themes = await VencordNative.themes.getThemesList();
        setUserThemes(themes);
    }

    // When a local theme is enabled/disabled, update the settings
    function onLocalThemeChange(fileName: string, value: boolean) {
        if (value) {
            if (settings.enabledThemes.includes(fileName)) return;
            settings.enabledThemes = [...settings.enabledThemes, fileName];
        } else {
            settings.enabledThemes = settings.enabledThemes.filter(f => f !== fileName);
        }
    }

    async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
        e.stopPropagation();
        e.preventDefault();
        if (!e.currentTarget?.files?.length) return;
        const { files } = e.currentTarget;

        const uploads = Array.from(files, file => {
            const { name } = file;
            if (!name.endsWith(".css")) return;

            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    VencordNative.themes.uploadTheme(name, reader.result as string)
                        .then(resolve)
                        .catch(reject);
                };
                reader.readAsText(file);
            });
        });

        await Promise.all(uploads);
        refreshLocalThemes();
    }

    function renderLocalThemes() {
        return (
            <>
                <Card className="vc-settings-card">
                    <Forms.FormTitle tag="h5">Find Themes:</Forms.FormTitle>
                    <div style={{ marginBottom: ".5em", display: "flex", flexDirection: "column" }}>
                        <Link style={{ marginRight: ".5em" }} href="https://betterdiscord.app/themes">
                            BetterDiscord Themes
                        </Link>
                        <Link href="https://github.com/search?q=discord+theme">GitHub</Link>
                    </div>
                    <Forms.FormText>If using the BD site, click on "Download" and place the downloaded .theme.css file into your themes folder.</Forms.FormText>
                </Card>

                <Forms.FormSection title="Local Themes">
                    <Card className="vc-settings-quick-actions-card">
                        <>
                            {IS_WEB ?
                                (
                                    <Button
                                        size={Button.Sizes.SMALL}
                                        disabled={themeDirPending}
                                    >
                                        Upload Theme
                                        <FileInput
                                            ref={fileInputRef}
                                            onChange={onFileUpload}
                                            multiple={true}
                                            filters={[{ extensions: ["css"] }]}
                                        />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => showItemInFolder(themeDir!)}
                                        size={Button.Sizes.SMALL}
                                        disabled={themeDirPending}
                                    >
                                        Open Themes Folder
                                    </Button>
                                )}
                            <Button
                                onClick={refreshLocalThemes}
                                size={Button.Sizes.SMALL}
                            >
                                Load missing Themes
                            </Button>
                            <Button
                                onClick={() => VencordNative.quickCss.openEditor()}
                                size={Button.Sizes.SMALL}
                            >
                                Edit QuickCSS
                            </Button>

                            {Vencord.Settings.plugins.ClientTheme.enabled && (
                                <Button
                                    onClick={() => openModal(modalProps => (
                                        <PluginModal
                                            {...modalProps}
                                            plugin={Vencord.Plugins.plugins.ClientTheme}
                                            onRestartNeeded={() => { }}
                                        />
                                    ))}
                                    size={Button.Sizes.SMALL}
                                >
                                    Edit ClientTheme
                                </Button>
                            )}
                        </>
                    </Card>

                    <div className={cl("grid")}>
                        {userThemes?.map(theme => (
                            <ThemeCard
                                key={theme.fileName}
                                enabled={settings.enabledThemes.includes(theme.fileName)}
                                onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                                onDelete={async () => {
                                    onLocalThemeChange(theme.fileName, false);
                                    await VencordNative.themes.deleteTheme(theme.fileName);
                                    refreshLocalThemes();
                                }}
                                theme={theme}
                            />
                        ))}
                    </div>
                </Forms.FormSection>
            </>
        );
    }

    function renderCssSnippets() {
        return (
            <>
                <Forms.FormSection title="CSS Snippets">
                    <Card className="vc-settings-quick-actions-card">
                        <>
                            <Button
                                onClick={async () => {
                                    const snippet: CssSnippet = {
                                        id: SnowflakeUtils.fromTimestamp(Date.now()),
                                        name: "New CSS Snippet",
                                        description: "",
                                        lastEdited: new Date().toISOString(),
                                        createdAt: new Date().toISOString(),
                                        origin: null,
                                        enabled: true,
                                        css: ""
                                    };
                                    openModal(modalProps =>
                                        <SnippetModal modalProps={modalProps} snippet={snippet} isNew={true} />
                                    );
                                }}
                                size={Button.Sizes.SMALL}
                            >
                                Create New Snippet
                            </Button>
                            <Button
                                onClick={async () => {
                                    const snippet: CssSnippet = {
                                        id: SnowflakeUtils.fromTimestamp(Date.now()),
                                        name: `Quick CSS ${new Date().toDateString()}`,
                                        description: "Imported from QuickCSS",
                                        lastEdited: new Date().toISOString(),
                                        createdAt: new Date().toISOString(),
                                        origin: "quickcss",
                                        enabled: Vencord.Settings.useQuickCss,
                                        css: await VencordNative.quickCss.get()
                                    };
                                    openModal(modalProps =>
                                        <SnippetModal modalProps={modalProps} snippet={snippet} isNew={true} onApply={() => {
                                            VencordNative.quickCss.set("");
                                        }} />
                                    );
                                }}
                                size={Button.Sizes.SMALL}
                            >
                                Import from QuickCSS
                            </Button>
                            <Button
                                onClick={() => VencordNative.quickCss.openEditor()}
                                size={Button.Sizes.SMALL}
                            >
                                {"Edit QuickCSS"}
                            </Button>
                        </>
                    </Card>

                    <div className={cl("grid")}>
                        {cssSnippets && sortSnippets(cssSnippets.list).map(snippet => <SnippetCard {...snippet} />)}
                    </div>
                </Forms.FormSection>
            </>
        );
    }

    // When the user leaves the online theme textbox, update the settings
    function onBlur() {
        settings.themeLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];
    }

    function renderOnlineThemes() {
        return (
            <>
                <Card className="vc-settings-card vc-text-selectable">
                    <Forms.FormTitle tag="h5">Paste links to css files here</Forms.FormTitle>
                    <Forms.FormText>One link per line</Forms.FormText>
                    <Forms.FormText>Make sure to use direct links to files (raw or github.io)!</Forms.FormText>
                </Card>

                <Forms.FormSection title="Online Themes" tag="h5">
                    <TextArea
                        value={themeText}
                        onChange={setThemeText}
                        className={classes(TextAreaProps.textarea, "vc-settings-theme-links")}
                        placeholder="Theme Links"
                        spellCheck={false}
                        onBlur={onBlur}
                        rows={10}
                    />
                    <Validators themeLinks={settings.themeLinks} />
                </Forms.FormSection>
            </>
        );
    }

    return (
        <SettingsTab title="Themes">
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.LOCAL}
                >
                    Local Themes
                </TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.CSS_SNIPPETS}
                >
                    CSS Snippets
                </TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.ONLINE}
                >
                    Online Themes
                </TabBar.Item>
            </TabBar>

            {currentTab === ThemeTab.LOCAL && renderLocalThemes()}
            {currentTab === ThemeTab.CSS_SNIPPETS && renderCssSnippets()}
            {currentTab === ThemeTab.ONLINE && renderOnlineThemes()}
        </SettingsTab>
    );
}

export default wrapTab(ThemesTab, "Themes");
