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

/** 翻译 */
function translate(e, url) {
    if (e.selectionText) {
        chrome.tabs.create({
            "url": url + e.selectionText
        })
    }
}

/** 谷歌翻译 */
function translateByGoogle(e) {
    translate(e, "https://translate.google.cn/#en/zh-CN/")
}

/** 百度翻译 */
function translateByBaidu(e) {
    translate(e, "https://fanyi.baidu.com/#en/zh/")
}

export const menu = {
    "menu": {
        "translate": {
            "google": {
                "contexts": ["selection"],
                "onclick": translateByGoogle
            },
            "baidu": {
                "contexts": ["selection"],
                "onclick": translateByBaidu
            },
            "contexts": ["selection"],
        }
    }
}