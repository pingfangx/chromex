/*
 * Copyright 2022 pingfangx <https://www.pingfangx.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {getCurrentTab} from "./tabs.js"

async function navigateToHlZhCn() {
    const tab = await getCurrentTab()
    if (!tab) {
        return
    }
    const url = new URL(tab.url)
    const k = "hl"
    const v = "zh-CN"
    if (url.searchParams.has(k)) {
        url.searchParams.set(k, v)
    } else {
        url.searchParams.append(k, v)
    }
    chrome.tabs.create({
        url: url.toString()
    })
}

export const menu = {
    "menu": {
        "navigate": {
            "hlZhCn": navigateToHlZhCn
        }
    }
}