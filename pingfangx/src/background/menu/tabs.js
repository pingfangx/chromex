/** 获取当前 tab */
async function getCurrentTab() {
    const queryOptions = {active: true, lastFocusedWindow: true}
    const [tab] = await chrome.tabs.query(queryOptions)
    return tab
}

export {getCurrentTab}