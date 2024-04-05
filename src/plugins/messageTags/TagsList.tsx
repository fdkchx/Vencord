/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./TagsList.css";

import { classNameFactory } from "@api/Styles";
import { DeleteIcon } from "@components/Icons";
import { Switch } from "@components/Switch";
import { classes, closeModal, ModalCloseButton, ModalContent, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/index";
import { findByPropsLazy } from "@webpack";
import { Button, Card, ScrollerThin, SnowflakeUtils, Text, TextArea, TextInput, Tooltip, useState } from "@webpack/common";

import { settings, Tag } from "./index";

const cl = classNameFactory("vc-messagetags-");

const iconClasses = findByPropsLazy("button", "wrapper", "disabled", "separator");

export function openEditor() {
    const key = openModal(props => (
        <ModalRoot {...props} size={ModalSize.LARGE}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Tags Editor</Text>
                <ModalCloseButton onClick={() => closeModal(key)} />
            </ModalHeader>

            <ModalContent>
                <ScrollerThin>
                    <TagsList setValue={v => (settings.store.tags = v)} />
                </ScrollerThin>
            </ModalContent>
        </ModalRoot>
    ));
}

export default function TagsList(props: { setValue(v: any): void; }) {
    const [tags, setTags] = useState(JSON.parse(settings.store.tags) as Tag[]);
    const setTag = (t: Tag) => {
        const i = tags.findIndex(t_ => t_.id === t.id);
        const newTags = [...tags];
        if (i < 0) {
            newTags.push(t);
        } else {
            newTags[i] = t;
        }
        setTags(newTags);
        props.setValue(JSON.stringify(newTags));
    };
    const deleteTag = (id: string) => {
        const newTags = [...tags].filter(t => t.id !== id);
        setTags(newTags);
        props.setValue(JSON.stringify(newTags));
    };

    return <div className={cl("editor")}>
        <div className={cl("list")}>
            {tags.map(t => (
                <Card className={cl("list-entry")}>
                    <div className={cl("entry-header")}>
                        <TextInput
                            className={cl("entry-name")}
                            value={t.name}
                            onChange={v => setTag({ ...t, name: v })}
                        />
                        <Switch
                            checked={t.enabled}
                            onChange={v => setTag({ ...t, enabled: v })}
                        />
                        <Tooltip text="Delete tag">
                            {props => (
                                <div
                                    {...props}
                                    className={classes(cl("entry-delete"), iconClasses.button, iconClasses.dangerous)}
                                    onClick={() => deleteTag(t.id)}
                                    role="button"
                                >
                                    <DeleteIcon width="20" height="20" />
                                </div>
                            )}
                        </Tooltip>
                    </div>
                    <TextArea
                        className={cl("entry-message")}
                        value={t.message}
                        onChange={v => setTag({ ...t, message: v })}
                        autoCorrect="false"
                    />
                </Card>
            ))}
        </div>
        <Button
            className={cl("new-button")}
            color={Button.Colors.GREEN}
            onClick={() => setTag({
                name: "new-tag",
                message: "",
                enabled: true,
                id: SnowflakeUtils.fromTimestamp(Date.now())
            })}
        >
            Create new tag
        </Button>
    </div>;
}
