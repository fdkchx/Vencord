/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { closeModal, openModal } from "@utils/modal.jsx";
import { Avatar, ChannelStore, ContextMenu, FluxDispatcher, GuildStore, Menu, Text, useDrag, useDrop, useRef, UserStore } from "@webpack/common";

import { BasicChannelTabsProps, Bookmark, BookmarkFolder, Bookmarks, channelTabsSettings as settings, ChannelTabsUtils, findSVGLazy, UseBookmark } from "../util";
import { NotificationDot, QuestionIcon } from "./ChannelTab";
import { BookmarkContextMenu, EditModal } from "./ContextMenus";

const { switchChannel, useBookmarks } = ChannelTabsUtils;
const cl = (name: string) => `vc-channeltabs-${name}`;

const Star = findSVGLazy("M21.924 8.61789C21.77 8.24489");

function BookmarkIcon({ bookmark }: { bookmark: Bookmark | BookmarkFolder; }) {
    if ("bookmarks" in bookmark) return <svg
        height={16}
        width={16}
        viewBox="0 0 24 24"
    >
        {/* folder icon */}
        <path fill={bookmark.iconColor} d="M20 7H12L10.553 5.106C10.214 4.428 9.521 4 8.764 4H3C2.447 4 2 4.447 2 5V19C2 20.104 2.895 21 4 21H20C21.104 21 22 20.104 22 19V9C22 7.896 21.104 7 20 7Z" />
    </svg>;

    const channel = ChannelStore.getChannel(bookmark.channelId);
    const guild = GuildStore.getGuild(bookmark.guildId);
    if (guild) return guild.icon
        ? <img
            src={`https://${window.GLOBAL_ENV.CDN_HOST}/icons/${guild?.id}/${guild?.icon}.png`}
            className={cl("bookmark-icon")}
        />
        : <div className={cl("bookmark-icon")}>
            <Text variant="text-xxs/semibold" tag="span">{guild.acronym}</Text>
        </div>;

    if (channel?.recipients?.length) {
        if (channel.recipients.length === 1) return <Avatar
            size="SIZE_16"
            src={UserStore.getUser(channel.recipients[0]).getAvatarURL(undefined, 128)}
        />;
        else return <img
            src={channel.icon
                ? `https://${window.GLOBAL_ENV.CDN_HOST}/channel-icons/${channel?.id}/${channel?.icon}.png`
                : "https://discord.com/assets/c6851bd0b03f1cca5a8c1e720ea6ea17.png" // Default Group Icon
            }
            className={cl("bookmark-icon")}
        />;
    }

    return <QuestionIcon height={16} width={16} />;
}

function BookmarkFolderOpenMenu(props: { bookmarks: Bookmarks, index: number, methods: UseBookmark[1]; }) {
    const { bookmarks, index, methods } = props;
    const bookmark = bookmarks[index] as BookmarkFolder;

    return <Menu.Menu
        navId="bookmark-folder-menu"
        onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
        aria-label="Bookmark Folder Menu"
    >
        {bookmark.bookmarks.map((bkm, i) => <Menu.MenuItem
            key={`bookmark-folder-entry-${bkm.channelId}`}
            id={`bookmark-folder-entry-${bkm.channelId}`}
            label={<span style={{ display: "flex", flexDirection: "row", gap: "0.25rem" }}>
                {bkm.name}<NotificationDot channelIds={[bkm.channelId]} />
            </span>}
            icon={() => <BookmarkIcon bookmark={bkm} />}
            showIconFirst={true}
            action={() => switchChannel(bkm)}

            children={[<Menu.MenuItem
                key="edit-bookmark"
                id="edit-bookmark"
                label="Edit Bookmark"
                action={() => {
                    const key = openModal(modalProps =>
                        <EditModal
                            modalProps={modalProps}
                            bookmark={bkm}
                            onSave={name => {
                                const newBookmarks = [...bookmark.bookmarks];
                                newBookmarks[i].name = name;
                                methods.editBookmark(index, { bookmarks: newBookmarks });
                                closeModal(key);
                            }}
                        />
                    );
                }}
            />,
            <Menu.MenuItem
                key="delete-bookmark"
                id="delete-bookmark"
                label="Delete Bookmark"
                action={() => {
                    methods.deleteBookmark(i, index);
                }}
            />,
            <Menu.MenuItem
                key="remove-bookmark-from-folder"
                id="remove-bookmark-from-folder"
                label="Remove Bookmark from Folder"
                action={() => {
                    const newBookmarks = [...bookmark.bookmarks];
                    newBookmarks.splice(i, 1);

                    methods.addBookmark(bkm);
                    methods.editBookmark(index, { bookmarks: newBookmarks });
                }}
            />]}
        />)}
    </Menu.Menu>;
}

function Bookmark(props: { bookmarks: Bookmarks, index: number, methods: UseBookmark[1]; }) {
    const { bookmarks, index, methods } = props;
    const bookmark = bookmarks[index];
    const { bookmarkNotificationDot } = settings.use(["bookmarkNotificationDot"]);

    const ref = useRef<HTMLDivElement>(null);

    const [, drag] = useDrag(() => ({
        type: "vc_Bookmark",
        item: () => {
            return { index };
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        }),
    }));

    const [, drop] = useDrop(() => ({
        accept: "vc_Bookmark",
        hover: (item, monitor) => {
            if (!ref.current) return;

            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;

            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleX =
                (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientX = clientOffset.x - hoverBoundingRect.left;
            if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX
                || dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
                return;
            }

            methods.moveDraggedBookmarks(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    }), []);
    drag(drop(ref));

    return <div
        className={cl("bookmark")}
        ref={ref}
        onClick={e => "bookmarks" in bookmark
            ? ContextMenu.open(e, () => <BookmarkFolderOpenMenu {...props} />)
            : switchChannel(bookmark)
        }
        onContextMenu={e => ContextMenu.open(e, () =>
            <BookmarkContextMenu {...props} />
        )}
    >
        <BookmarkIcon bookmark={bookmark} />
        <Text variant="text-sm/normal" className={cl("name-text")}>{bookmark.name}</Text>
        {bookmarkNotificationDot && <NotificationDot channelIds={"bookmarks" in bookmark
            ? bookmark.bookmarks.map(b => b.channelId)
            : [bookmark.channelId]
        } />}
    </div>;
}

export default function BookmarkContainer(props: BasicChannelTabsProps & { userId: string; }) {
    const { guildId, channelId, userId } = props;
    const [bookmarks, methods] = useBookmarks(userId);

    let isCurrentChannelBookmarked = false, currentChannelFolderIndex = -1;
    bookmarks?.forEach((bookmark, i) => {
        if ("bookmarks" in bookmark) {
            if (bookmark.bookmarks.some(b => b.channelId === channelId)) {
                isCurrentChannelBookmarked = true;
                currentChannelFolderIndex = i;
            }
        }
        else if (bookmark.channelId === channelId) isCurrentChannelBookmarked = true;
    });

    return <div className={cl("inner-container")}>
        <button className={cl("button")} onClick={() => isCurrentChannelBookmarked
            ? currentChannelFolderIndex === -1
                ? methods.deleteBookmark(
                    bookmarks!.findIndex(b => !("bookmarks" in b) && b.channelId === channelId)
                )
                : methods.deleteBookmark(
                    (bookmarks![currentChannelFolderIndex] as BookmarkFolder).bookmarks
                        .findIndex(b => b.channelId === channelId),
                    currentChannelFolderIndex
                )
            : methods.addBookmark({
                guildId,
                channelId
            })}
        >
            <Star
                height={20}
                width={20}
                foreground={isCurrentChannelBookmarked ? cl("bookmark-star-checked") : cl("bookmark-star")}
            />
        </button>
        {bookmarks
            ? bookmarks.length
                ? bookmarks.map((_, i) =>
                    <Bookmark key={i} index={i} bookmarks={bookmarks} methods={methods} />
                )
                : <Text className={cl("bookmark-placeholder-text")} variant="text-xs/normal">
                    You have no bookmarks. You can add an open tab or hide this by right clicking it
                </Text>
            : <Text className={cl("bookmark-placeholder-text")} variant="text-xs/normal">
                Loading bookmarks...
            </Text>
        }
    </div>;
}
