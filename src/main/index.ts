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

import { app, net, protocol, session } from "electron";
import monacoHtml from "file://monacoWin.html?minify&base64";
import { createReadStream } from "fs";
import { join } from "path";
import { PassThrough } from "stream";

import { ensureSafePath } from "./ipcMain";
import { RendererSettings } from "./settings";
import { IS_VANILLA, THEMES_DIR } from "./utils/constants";
import { installExt } from "./utils/extensions";

if (IS_VESKTOP || !IS_VANILLA) {
    app.whenReady().then(() => {
        // Source Maps! Maybe there's a better way but since the renderer is executed
        // from a string I don't think any other form of sourcemaps would work
        protocol.registerStreamProtocol("vencord", ({ url: unsafeUrl }, cb) => {
            let url = unsafeUrl.slice("vencord://".length);
            if (url.endsWith("/")) url = url.slice(0, -1);
            if (url.startsWith("/themes/")) {
                const theme = url.slice("/themes/".length);
                const safeUrl = ensureSafePath(THEMES_DIR, theme);
                if (!safeUrl) {
                    cb({ statusCode: 403 });
                    return;
                }
                cb(createReadStream(safeUrl.replace(/\?v=\d+$/, "")));
                return;
            }
            if (url.startsWith("/monacoEditor")) {
                const data = new PassThrough();
                data.push(monacoHtml);
                data.push(null);
                cb(data);
                return;
            }
            switch (url) {
                case "renderer.js.map":
                case "vencordDesktopRenderer.js.map":
                case "preload.js.map":
                case "vencordDesktopPreload.js.map":
                case "patcher.js.map":
                case "vencordDesktopMain.js.map":
                case "discord.html":
                    cb(createReadStream(join(__dirname, url)));
                    break;
                default:
                    cb({ statusCode: 403 });
            }
        });

        const discordHtmlBase64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sPgogICAgPGhlYWQ+CiAgICAgICAgPG1ldGEgY2hhcnNldD0idXRmLTgiPgogICAgICAgIDxtZXRhIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTEsbWF4aW11bS1zY2FsZT0zIiBuYW1lPSJ2aWV3cG9ydCI+CiAgICAgICAgPCEtLSBzZWN0aW9uOnNlb21ldGEgLS0+CiAgICAgICAgPG1ldGEgcHJvcGVydHk9Im9nOnR5cGUiIGNvbnRlbnQ9IndlYnNpdGUiPgogICAgICAgIDxtZXRhIHByb3BlcnR5PSJvZzpzaXRlX25hbWUiIGNvbnRlbnQ9IkRpc2NvcmQiPgogICAgICAgIDxtZXRhIHByb3BlcnR5PSJvZzp0aXRsZSIgY29udGVudD0iRGlzY29yZCAtIEdyb3VwIENoYXQgVGhhdOKAmXMgQWxsIEZ1biAmYW1wOyBHYW1lcyI+CiAgICAgICAgPG1ldGEgcHJvcGVydHk9Im9nOmRlc2NyaXB0aW9uIiBjb250ZW50PSJEaXNjb3JkIGlzIGdyZWF0IGZvciBwbGF5aW5nIGdhbWVzIGFuZCBjaGlsbGluZyB3aXRoIGZyaWVuZHMsIG9yIGV2ZW4gYnVpbGRpbmcgYSB3b3JsZHdpZGUgY29tbXVuaXR5LiBDdXN0b21pemUgeW91ciBvd24gc3BhY2UgdG8gdGFsaywgcGxheSwgYW5kIGhhbmcgb3V0LiI+CiAgICAgICAgPG1ldGEgcHJvcGVydHk9Im9nOmltYWdlIiBjb250ZW50PSJodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hc3NldHMvb2dfaW1nX2Rpc2NvcmRfaG9tZS5wbmciPgogICAgICAgIDxtZXRhIG5hbWU9InR3aXR0ZXI6Y2FyZCIgY29udGVudD0ic3VtbWFyeV9sYXJnZV9pbWFnZSI+CiAgICAgICAgPG1ldGEgbmFtZT0idHdpdHRlcjpzaXRlIiBjb250ZW50PSJAZGlzY29yZCI+CiAgICAgICAgPG1ldGEgbmFtZT0idHdpdHRlcjpjcmVhdG9yIiBjb250ZW50PSJAZGlzY29yZCI+CiAgICAgICAgPCEtLSBlbmRzZWN0aW9uIC0tPgogICAgICAgIDxzY3JpcHQgbm9uY2U9Ik1UVXNNakV4TERFek9Td3hNamdzTWpNekxERTBPQ3d5T0N3eE9ERT0iPgogICAgICAgICAgICB3aW5kb3cuR0xPQkFMX0VOViA9IHsKICAgICAgICAgICAgICAgIEFQSV9FTkRQT0lOVDogJy8vZGlzY29yZC5jb20vYXBpJywKICAgICAgICAgICAgICAgIEFQSV9WRVJTSU9OOiA5LAogICAgICAgICAgICAgICAgR0FURVdBWV9FTkRQT0lOVDogJ3dzczovL2dhdGV3YXkuZGlzY29yZC5nZycsCiAgICAgICAgICAgICAgICBXRUJBUFBfRU5EUE9JTlQ6ICcvL2Rpc2NvcmQuY29tJywKICAgICAgICAgICAgICAgIENETl9IT1NUOiAnY2RuLmRpc2NvcmRhcHAuY29tJywKICAgICAgICAgICAgICAgIEFTU0VUX0VORFBPSU5UOiAnLy9kaXNjb3JkLmNvbScsCiAgICAgICAgICAgICAgICBNRURJQV9QUk9YWV9FTkRQT0lOVDogJy8vbWVkaWEuZGlzY29yZGFwcC5uZXQnLAogICAgICAgICAgICAgICAgV0lER0VUX0VORFBPSU5UOiAnLy9kaXNjb3JkLmNvbS93aWRnZXQnLAogICAgICAgICAgICAgICAgSU5WSVRFX0hPU1Q6ICdkaXNjb3JkLmdnJywKICAgICAgICAgICAgICAgIEdVSUxEX1RFTVBMQVRFX0hPU1Q6ICdkaXNjb3JkLm5ldycsCiAgICAgICAgICAgICAgICBHSUZUX0NPREVfSE9TVDogJ2Rpc2NvcmQuZ2lmdCcsCiAgICAgICAgICAgICAgICBSRUxFQVNFX0NIQU5ORUw6ICdzdGFibGUnLAogICAgICAgICAgICAgICAgREVWRUxPUEVSU19FTkRQT0lOVDogJy8vZGlzY29yZC5jb20nLAogICAgICAgICAgICAgICAgTUFSS0VUSU5HX0VORFBPSU5UOiAnLy9kaXNjb3JkLmNvbScsCiAgICAgICAgICAgICAgICBCUkFJTlRSRUVfS0VZOiAncHJvZHVjdGlvbl9rdHpwOGhmcF80OXBwMnJwNHBoeW03Mzg3JywKICAgICAgICAgICAgICAgIFNUUklQRV9LRVk6ICdwa19saXZlX0NVUXRscFFVRjB2dWZXcG5wVW1RdmNkaScsCiAgICAgICAgICAgICAgICBBRFlFTl9LRVk6ICdsaXZlX0UzT1EzM1Y2R1ZHVFhPVlFaRUFGUUo2REpJRFZHNlNZJywKICAgICAgICAgICAgICAgIE5FVFdPUktJTkdfRU5EUE9JTlQ6ICcvL3JvdXRlci5kaXNjb3JkYXBwLm5ldCcsCiAgICAgICAgICAgICAgICBSVENfTEFURU5DWV9FTkRQT0lOVDogJy8vbGF0ZW5jeS5kaXNjb3JkLm1lZGlhL3J0YycsCiAgICAgICAgICAgICAgICBBQ1RJVklUWV9BUFBMSUNBVElPTl9IT1NUOiAnZGlzY29yZHNheXMuY29tJywKICAgICAgICAgICAgICAgIFBST0pFQ1RfRU5WOiAncHJvZHVjdGlvbicsCiAgICAgICAgICAgICAgICBSRU1PVEVfQVVUSF9FTkRQT0lOVDogJy8vcmVtb3RlLWF1dGgtZ2F0ZXdheS5kaXNjb3JkLmdnJywKICAgICAgICAgICAgICAgIFNFTlRSWV9UQUdTOiB7CiAgICAgICAgICAgICAgICAgICAgImJ1aWxkSWQiOiAiMzY2Yzc0NjE3M2E2Y2EwYTgwMWU5ZjRhNGQ3YjY3NDVlNmRlNDVkNCIsCiAgICAgICAgICAgICAgICAgICAgImJ1aWxkVHlwZSI6ICJub3JtYWwiCiAgICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgICAgTUlHUkFUSU9OX1NPVVJDRV9PUklHSU46ICdodHRwczovL2Rpc2NvcmRhcHAuY29tJywKICAgICAgICAgICAgICAgIE1JR1JBVElPTl9ERVNUSU5BVElPTl9PUklHSU46ICdodHRwczovL2Rpc2NvcmQuY29tJywKICAgICAgICAgICAgICAgIEhUTUxfVElNRVNUQU1QOiBEYXRlLm5vdygpLAogICAgICAgICAgICAgICAgQUxHT0xJQV9LRVk6ICdhY2EwZDcwODJlNGU2M2FmNWJhNTkxN2Q1ZTk2YmVkMCcsCiAgICAgICAgICAgICAgICBQVUJMSUNfUEFUSDogJy9hc3NldHMvJwogICAgICAgICAgICB9OwogICAgICAgIDwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgbm9uY2U9Ik1UVXNNakV4TERFek9Td3hNamdzTWpNekxERTBPQ3d5T0N3eE9ERT0iPgogICAgICAgICAgICAhZnVuY3Rpb24oKSB7CiAgICAgICAgICAgICAgICBpZiAobnVsbCA9PSB3aW5kb3cuV2ViU29ja2V0KQogICAgICAgICAgICAgICAgICAgIHJldHVybjsKICAgICAgICAgICAgICAgIHZhciBuID0gZnVuY3Rpb24obikgewogICAgICAgICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obik7CiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsID09IG8gPyBudWxsIDogSlNPTi5wYXJzZShvKQogICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKG4pIHsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGwKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9OwogICAgICAgICAgICAgICAgaWYgKCFuKCJ0b2tlbiIpIHx8IHdpbmRvdy5fX09WRVJMQVlfXykKICAgICAgICAgICAgICAgICAgICByZXR1cm47CiAgICAgICAgICAgICAgICB2YXIgbyA9IG51bGwgIT0gd2luZG93LkRpc2NvcmROYXRpdmUgfHwgbnVsbCAhPSB3aW5kb3cucmVxdWlyZSA/ICJldGYiIDogImpzb24iCiAgICAgICAgICAgICAgICAgICwgZSA9IHdpbmRvdy5HTE9CQUxfRU5WLkdBVEVXQVlfRU5EUE9JTlQgKyAiLz9lbmNvZGluZz0iICsgbyArICImdj0iICsgd2luZG93LkdMT0JBTF9FTlYuQVBJX1ZFUlNJT047CiAgICAgICAgICAgICAgICAidHJ1ZSIgPT09IG4oInpzdGRfZmFzdF9jb25uZWN0IikgJiYgbnVsbCAhPSB3aW5kb3cuRGlzY29yZE5hdGl2ZSAmJiB2b2lkIDAgIT09IHdpbmRvdy5VaW50OEFycmF5ICYmIHZvaWQgMCAhPT0gd2luZG93LlRleHREZWNvZGVyID8gZSArPSAiJmNvbXByZXNzPXpzdGQtc3RyZWFtIiA6IHZvaWQgMCAhPT0gd2luZG93LlVpbnQ4QXJyYXkgJiYgKGUgKz0gIiZjb21wcmVzcz16bGliLXN0cmVhbSIpLAogICAgICAgICAgICAgICAgY29uc29sZS5sb2coIltGQVNUIENPTk5FQ1RdICIgKyBlICsgIiwgZW5jb2Rpbmc6ICIgKyBvICsgIiwgdmVyc2lvbjogIiArIHdpbmRvdy5HTE9CQUxfRU5WLkFQSV9WRVJTSU9OKTsKICAgICAgICAgICAgICAgIHZhciBpID0gbmV3IFdlYlNvY2tldChlKTsKICAgICAgICAgICAgICAgIGkuYmluYXJ5VHlwZSA9ICJhcnJheWJ1ZmZlciI7CiAgICAgICAgICAgICAgICB2YXIgciA9IERhdGUubm93KCkKICAgICAgICAgICAgICAgICAgLCB0ID0gewogICAgICAgICAgICAgICAgICAgIG9wZW46ICExLAogICAgICAgICAgICAgICAgICAgIGlkZW50aWZ5OiAhMSwKICAgICAgICAgICAgICAgICAgICBnYXRld2F5OiBlLAogICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiBbXQogICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgIGkub25vcGVuID0gZnVuY3Rpb24oKSB7CiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIltGQVNUIENPTk5FQ1RdIGNvbm5lY3RlZCBpbiAiICsgKERhdGUubm93KCkgLSByKSArICJtcyIpLAogICAgICAgICAgICAgICAgICAgIHQub3BlbiA9ICEwCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAsCiAgICAgICAgICAgICAgICBpLm9uY2xvc2UgPSBpLm9uZXJyb3IgPSBmdW5jdGlvbigpIHsKICAgICAgICAgICAgICAgICAgICB3aW5kb3cuX3dzID0gbnVsbAogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgLAogICAgICAgICAgICAgICAgaS5vbm1lc3NhZ2UgPSBmdW5jdGlvbihuKSB7CiAgICAgICAgICAgICAgICAgICAgdC5tZXNzYWdlcy5wdXNoKG4pCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAsCiAgICAgICAgICAgICAgICB3aW5kb3cuX3dzID0gewogICAgICAgICAgICAgICAgICAgIHdzOiBpLAogICAgICAgICAgICAgICAgICAgIHN0YXRlOiB0CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0oKQogICAgICAgIDwvc2NyaXB0PgogICAgICAgIDwhLS0gc2VjdGlvbjp0aXRsZSAtLT4KICAgICAgICA8dGl0bGU+RGlzY29yZDwvdGl0bGU+CiAgICAgICAgPCEtLSBlbmRzZWN0aW9uIC0tPgogICAgICAgIDxsaW5rIHJlbD0iaWNvbiIgaHJlZj0iL2Fzc2V0cy9pbWFnZXMvZmF2aWNvbi5pY28iLz4KICAgICAgICA8bGluayBocmVmPSIvYXNzZXRzLzQ5MjM3LjMxN2RiMzM1ZmEwMTVhYTFhYTU1LmNzcyIgcmVsPSJzdHlsZXNoZWV0Ii8+CiAgICAgICAgPGxpbmsgaHJlZj0iL2Fzc2V0cy85OTM4Ny5lZjk4NWM3YWQ3ZmZmOGU2MDAyNi5jc3MiIHJlbD0ic3R5bGVzaGVldCIvPgogICAgPC9oZWFkPgogICAgPGJvZHk+CiAgICAgICAgPGRpdiBpZD0iYXBwLW1vdW50Ij48L2Rpdj4KICAgICAgICA8c2NyaXB0IG5vbmNlPSJNVFVzTWpFeExERXpPU3d4TWpnc01qTXpMREUwT0N3eU9Dd3hPREU9Ij4KICAgICAgICAgICAgd2luZG93Ll9fT1ZFUkxBWV9fID0gL292ZXJsYXkvLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpCiAgICAgICAgPC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBub25jZT0iTVRVc01qRXhMREV6T1N3eE1qZ3NNak16TERFME9Dd3lPQ3d4T0RFPSI+CiAgICAgICAgICAgIHdpbmRvdy5fX0JJTExJTkdfU1RBTkRBTE9ORV9fID0gL15cL2JpbGxpbmcvLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpCiAgICAgICAgPC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvc2hhcmVkLjkxZjVlNTIxMmNmOTEzYWJhNGIxLmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy9hcHAuMjZjNGYxOGJiZTQ2OWUzM2U3ZmUuanMiIGRlZmVyPjwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgc3JjPSIvYXNzZXRzLzI0MjE3LmZiZWNiYzFkNmE5NzRmYmM3NzdlLmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy82MjczNC4xODQyNTY3ZjI0YzdhMGFiNzlhMy5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvNDI0ODIuZWJmMDIxMTgxMDE5MzhjZjE5YmIuanMiIGRlZmVyPjwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgc3JjPSIvYXNzZXRzLzQzNDU1LjI1ZjNkZDg5ZmEwMjdlZjEyYjY3LmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy82NDc4Ny4zNTljNGFiYTRiZjYxYmE2N2NjMC5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvMjc5Ny5hMDEyNzE4ZWUzZGZkNDE3OTEyOC5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvMzEwNTguMTBlYTYxYjhlMTQyYmZmZmMwYTYuanMiIGRlZmVyPjwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgc3JjPSIvYXNzZXRzLzMyOTQ4LjEzYTk1YWEyMTU4Njg3MDhiMDEyLmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy84NDQ3MS43MTBiMmIwMzFmZmIyNDRjZjE0YS5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvNzAzOTcuMjI2YmI4NDcyMDQ5MTRlODVkNjIuanMiIGRlZmVyPjwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgc3JjPSIvYXNzZXRzLzQyNDU4LjhjNmE1MDg3MDRlMzEyYWJkYjE3LmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy81NDgwNy4wMmE0OTVmMjk1N2ZmOGU5YTU3My5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvd2ViLmUwZjkzODViZWI3ZDY0NjljZDcxLmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy8yNDIxNy5mYmVjYmMxZDZhOTc0ZmJjNzc3ZS5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvNjI3MzQuMTg0MjU2N2YyNGM3YTBhYjc5YTMuanMiIGRlZmVyPjwvc2NyaXB0PgogICAgICAgIDxzY3JpcHQgc3JjPSIvYXNzZXRzLzQzNDU1LjI1ZjNkZDg5ZmEwMjdlZjEyYjY3LmpzIiBkZWZlcj48L3NjcmlwdD4KICAgICAgICA8c2NyaXB0IHNyYz0iL2Fzc2V0cy84NDQ3MS43MTBiMmIwMzFmZmIyNDRjZjE0YS5qcyIgZGVmZXI+PC9zY3JpcHQ+CiAgICAgICAgPHNjcmlwdCBzcmM9Ii9hc3NldHMvc2VudHJ5LjI5MmRjM2VjMTYwNTk3ZmNmYTg1LmpzIiBkZWZlcj48L3NjcmlwdD4KICAgIDwvYm9keT4KPC9odG1sPgo=";
        protocol.registerBufferProtocol("discord-app", (req, cb) => cb(Buffer.from(discordHtmlBase64, "base64")));

        const domains = "canary.discord.com canary.discordapp.com ptb.discord.com ptb.discordapp.com discord.com discordapp.com".split(" ");
        const httpsHandler = req => {
            console.log(req.url);
            const { host, pathname } = new URL(req.url);
            if (domains.includes(host) && ["/assets", "/api"].every(p => !pathname.startsWith(p)))
                // @ts-ignore
                return net.fetch("discord-app://");
            // @ts-ignore
            return net.fetch(req, { bypassCustomProtocolHandlers: true });
        };
        // @ts-ignore
        protocol.handle("https", httpsHandler);

        try {
            if (RendererSettings.store.enableReactDevtools)
                installExt("fmkadmapgofadopljbjfkapdkoienihi")
                    .then(() => console.info("[Vencord] Installed React Developer Tools"))
                    .catch(err => console.error("[Vencord] Failed to install React Developer Tools", err));
        } catch { }


        const findHeader = (headers: Record<string, string[]>, headerName: Lowercase<string>) => {
            return Object.keys(headers).find(h => h.toLowerCase() === headerName);
        };

        // Remove CSP
        type PolicyResult = Record<string, string[]>;

        const parsePolicy = (policy: string): PolicyResult => {
            const result: PolicyResult = {};
            policy.split(";").forEach(directive => {
                const [directiveKey, ...directiveValue] = directive.trim().split(/\s+/g);
                if (directiveKey && !Object.prototype.hasOwnProperty.call(result, directiveKey)) {
                    result[directiveKey] = directiveValue;
                }
            });

            return result;
        };
        const stringifyPolicy = (policy: PolicyResult): string =>
            Object.entries(policy)
                .filter(([, values]) => values?.length)
                .map(directive => directive.flat().join(" "))
                .join("; ");

        const patchCsp = (headers: Record<string, string[]>) => {
            const header = findHeader(headers, "content-security-policy");

            if (header) {
                const csp = parsePolicy(headers[header][0]);

                for (const directive of ["style-src", "connect-src", "img-src", "font-src", "media-src", "worker-src"]) {
                    csp[directive] ??= [];
                    csp[directive].push("*", "blob:", "data:", "vencord:", "'unsafe-inline'");
                }

                // TODO: Restrict this to only imported packages with fixed version.
                // Perhaps auto generate with esbuild
                csp["script-src"] ??= [];
                csp["script-src"].push("'unsafe-eval'", "https://unpkg.com", "https://cdnjs.cloudflare.com");
                headers[header] = [stringifyPolicy(csp)];
            }
        };

        session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders, resourceType }, cb) => {
            if (responseHeaders) {
                if (resourceType === "mainFrame")
                    patchCsp(responseHeaders);

                // Fix hosts that don't properly set the css content type, such as
                // raw.githubusercontent.com
                if (resourceType === "stylesheet") {
                    const header = findHeader(responseHeaders, "content-type");
                    if (header)
                        responseHeaders[header] = ["text/css"];
                }
            }

            cb({ cancel: false, responseHeaders });
        });

        // assign a noop to onHeadersReceived to prevent other mods from adding their own incompatible ones.
        // For instance, OpenAsar adds their own that doesn't fix content-type for stylesheets which makes it
        // impossible to load css from github raw despite our fix above
        session.defaultSession.webRequest.onHeadersReceived = () => { };
    });
}

if (IS_DISCORD_DESKTOP) {
    require("./patcher");
}
