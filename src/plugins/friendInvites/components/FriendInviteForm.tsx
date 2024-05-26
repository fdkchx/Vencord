/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./FriendInviteForm.css";

import { Flex } from "@components/Flex";
import { Button, FluxDispatcher, Forms, useEffect, useState } from "@webpack/common";

import { FriendInvites, InviteRow } from "..";

export default function FriendInviteForm(props: any) {
    const [invites, setInvites] = useState([] as any[]);
    const [loaded, setLoaded] = useState(false);
    const setInvitesWrapper = (value: any[] | ((state: any[]) => any[])) => {
        !loaded && setLoaded(true);
        setInvites(value);
    };
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
        const onFetched = ({ invites }) => setInvitesWrapper(invites);
        FluxDispatcher.subscribe("FRIEND_INVITES_FETCH_RESPONSE", onFetched);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITES_FETCH_RESPONSE", onFetched);
        };
    }, []);

    useEffect(() => {
        const onCreated = ({ invite }) => setInvitesWrapper(state => [...state, invite]);
        FluxDispatcher.subscribe("FRIEND_INVITE_CREATE_SUCCESS", onCreated);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITE_CREATE_SUCCESS", onCreated);
        };
    }, []);

    useEffect(() => {
        const onRevoked = () => setInvitesWrapper([]);
        FluxDispatcher.subscribe("FRIEND_INVITE_REVOKE_SUCCESS", onRevoked);
        return () => {
            FluxDispatcher.unsubscribe("FRIEND_INVITE_REVOKE_SUCCESS", onRevoked);
        };
    }, []);

    return <div className="vc-friend-invites">
        <Forms.FormTitle tag="h2">Friend Invites</Forms.FormTitle>
        <Flex dir="horizontal">
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
        <Forms.FormSection className="vc-friend-invites-list">
            {loaded && (invites.length ? invites.map(fi => <InviteRow
                vencordFriendInvite
                invite={{
                    code: fi.code,
                    uses: fi.uses,
                    maxUses: fi.max_uses,
                    getExpiresAt: () => new Date(fi.expires_at)
                }}
            />) : <Forms.FormText>
                You have no friend invites.
            </Forms.FormText>)}
        </Forms.FormSection>
    </div>;
}
