/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./FriendInviteForm.css";

import { Flex } from "@components/Flex";
import { findByPropsLazy } from "@webpack";
import { Button, Flex as DiscordFlex, FluxDispatcher, Forms, i18n, useEffect, useState } from "@webpack/common";

import { FriendInvites, InviteRow } from "..";

// Don't destructure these or it will explode don't ask me why
const margins = findByPropsLazy("marginReset");
const styles = findByPropsLazy("headerSection", "textAlignRight", "headerDivider");
const useTheme = findByPropsLazy("useTheme");

const EmptyState = findByPropsLazy("EmptyStateImage");

const darkSrc = "/assets/7a9d1a80c1bea63ea80f.svg";
const lightSrc = "/assets/e27cbc96c70924c1f6d3.svg";

export default function FriendInviteForm(props: any) {
    const [invites, setInvites] = useState([] as any[]);

    useEffect(() => {
        FriendInvites.getAllFriendInvites();
    }, []);

    useEffect(() => {
        const onFriend = ({ relationship }) => relationship.type === 1 && FriendInvites.getAllFriendInvites();
        FluxDispatcher.subscribe("RELATIONSHIP_ADD", onFriend);
        return () => {
            FluxDispatcher.unsubscribe("RELATIONSHIP_ADD", onFriend);
        };
    }, []);

    useEffect(() => {
        const onFetched = ({ invites }) => setInvites(invites);
        FluxDispatcher.subscribe("FRIEND_INVITES_FETCH_RESPONSE", onFetched);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITES_FETCH_RESPONSE", onFetched);
        };
    }, []);

    useEffect(() => {
        const onCreated = ({ invite }) => setInvites(state => [...state, invite]);
        FluxDispatcher.subscribe("FRIEND_INVITE_CREATE_SUCCESS", onCreated);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITE_CREATE_SUCCESS", onCreated);
        };
    }, []);

    useEffect(() => {
        const onRevoked = () => setInvites([]);
        FluxDispatcher.subscribe("FRIEND_INVITE_REVOKE_SUCCESS", onRevoked);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITE_REVOKE_SUCCESS", onRevoked);
        };
    }, []);

    const theme = useTheme.useTheme();

    return <div className="vc-friend-invites">
        <Forms.FormTitle tag="h2">Friend Invites</Forms.FormTitle>
        <Flex flexDirection="row">
            <Button
                onClick={() => {
                    FriendInvites.createFriendInvite();
                }}
            >
                Create Friend Invite
            </Button>
            <Button
                onClick={() => {
                    FriendInvites.revokeFriendInvites();
                }}
                color={Button.Colors.RED}
            >
                Delete all Friend Invites
            </Button>
        </Flex>
        <Forms.FormDivider className={styles.headerDivider} />
        {invites.length ? <Forms.FormSection className="vc-friend-invites-list">
            <DiscordFlex className={styles.headerSection}>
                <DiscordFlex.Child
                    grow={0}
                    basis={"64px"}
                    className={margins.marginReset}
                >
                    <Forms.FormTitle>
                        {"QR Code"}
                    </Forms.FormTitle>
                </DiscordFlex.Child>
                <DiscordFlex.Child
                    grow={3}
                    basis={0}
                    className={margins.marginReset}
                >
                    <Forms.FormTitle>
                        {i18n.Messages.INSTANT_INVITE_INVITE_CODE}
                    </Forms.FormTitle>
                </DiscordFlex.Child>
                <DiscordFlex.Child
                    grow={1}
                    basis={0}
                    className={styles.textAlignRight}
                >
                    <Forms.FormTitle>
                        {i18n.Messages.INSTANT_INVITE_USES}
                    </Forms.FormTitle>
                </DiscordFlex.Child>
                <DiscordFlex.Child
                    grow={2}
                    basis={0}
                    className={styles.textAlignRight}
                >
                    <Forms.FormTitle>
                        {i18n.Messages.INSTANT_INVITE_EXPIRES}
                    </Forms.FormTitle>
                </DiscordFlex.Child>
            </DiscordFlex>
            {invites.toSorted(
                (a, b) => (new Date(b.expires_at) as unknown as number) - (new Date(a.expires_at) as unknown as number)
            ).map((fi: { code: string; uses: number; max_uses: number; expires_at: string; }) =>
                <InviteRow
                    vencordFriendInvite
                    invite={{
                        code: fi.code,
                        uses: fi.uses,
                        maxUses: fi.max_uses,
                        getExpiresAt: () => new Date(fi.expires_at)
                    }}
                />
            )}
        </Forms.FormSection> : <Forms.FormSection className="vc-friend-invites-empty">
            <EmptyState.default
                theme={theme}
            >
                <EmptyState.EmptyStateImage
                    darkSrc={darkSrc}
                    lightSrc={lightSrc}
                    width={256}
                    height={130}
                />
                <EmptyState.EmptyStateText
                    note={i18n.Messages.NO_INVITES_BODY}
                    children={i18n.Messages.NO_INVITES_LABEL}
                />
            </EmptyState.default>
        </Forms.FormSection>}
    </div >;
}
