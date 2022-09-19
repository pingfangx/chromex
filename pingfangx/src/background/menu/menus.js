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

import {menu as copyMenu, registerCopyMenuMessageReceiver} from "./copy.js"
import {menu as actionMenu} from "./navigate.js"
import {menu as translateMenu} from "./translate.js"

/** 所有上下文菜单，在 collectMenu 中填充 */
const CONTEXT_MENUS = {}

/** 是否是 menu 值 */
function isMenuValue(value) {
    return value instanceof Function // value 是 Function
        || value.hasOwnProperty("onclick") // value 是字典，onclick 命名参数创建菜单
}

/** 收集菜单 */
function collectMenu() {
    const menus = [
        copyMenu,
        actionMenu,
        translateMenu,
    ]
    for (const menu of menus) {
        // 后续可以加入配置，在配置页设置是否启用该菜单
        for (const [key, value] of Object.entries(menu)) {
            if (CONTEXT_MENUS.hasOwnProperty(key)) {
                // 已经存在，合并
                Object.assign(CONTEXT_MENUS[key], value)
            } else {
                CONTEXT_MENUS[key] = value
            }
        }
    }
}

/** 创建菜单 */
function crateMenu() {
    // background 指 manifest 中的配置项，用于在 messages 中区分业务
    return iterMenu(CONTEXT_MENUS, "background", null,
        function (id, param, key, value) {
            // 以 id 为 key 从 messages 中取标题
            const messageKey = id.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
            let title = chrome.i18n.getMessage(messageKey)
            let contexts // 上下文，未指定则为 all
            if (value.hasOwnProperty("contexts")) {
                contexts = value["contexts"]
            } else {
                contexts = ["all"]
            }
            if (!title) {
                console.warn(`message of ${messageKey} is empty`)
                title = `{${messageKey}}`
            }
            // 返回创建的菜单作为 parent
            return chrome.contextMenus.create({
                "title": title,
                "parentId": param,
                "id": id,
                "contexts": contexts,
            })
        })
}

/** 检查菜单 */
function checkMenu(param) {
    return iterMenu(CONTEXT_MENUS, "background", param,
        function (id, param, key, value) {
            if (id === param["menuItemId"]) {
                if (value.hasOwnProperty("onclick")) {
                    // 如果有 onclick 属性，则取出作为 value
                    value = value["onclick"]
                }
                if (value instanceof Function) {
                    if (value.length === 0) {
                        value()
                    } else if (value.length === 1) {
                        value(param)
                    } else {
                        console.error("error function length: " + value.length + " of " + value)
                    }
                }
                return true
            } else {
                return false
            }
        })
}

/**
 * 迭代菜单
 *
 * @param menus 菜单
 * @param parentId 父级 id
 * @param param 参数
 * @param callback 迭代过程中的回调
 * @returns {boolean} 是否继续迭代
 */
function iterMenu(menus, parentId, param, callback) {
    for (const [key, value] of Object.entries(menus)) {
        if (key === "contexts") {
            // contexts 用来控制父级菜单创建的上下文，不需要迭代
            continue
        }
        // 保持统一，都使用 camelCase
        const id = parentId + key.charAt(0).toUpperCase() + key.slice(1)
        const result = callback(id, param, key, value)
        let newParam
        if (result === true) {
            return true
        } else if (result === false) {
            // 返回 false，继续迭代，还是使用之前的 param
            // 如果赋值 param，会导致在迭代过程中变化
            newParam = param
        } else {
            newParam = result
        }
        if (!isMenuValue(value)) {
            // 不是菜单则继续迭代
            if (iterMenu(value, id, newParam, callback)) {
                return true
            }
        }
    }
    // 循环结束返回 false
    return false
}

/** 初始化菜单 */
function initMenu() {
    // 收集
    collectMenu()
    // 创建
    chrome.runtime.onInstalled.addListener(function () {
        // 只需在 onInstalled 创建即可
        crateMenu()
    })
    // 监听菜单点击
    chrome.contextMenus.onClicked.addListener(function (event) {
        checkMenu(event)
    })
    // 注册消息监听
    registerCopyMenuMessageReceiver()
}

export {initMenu}