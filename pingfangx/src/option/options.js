function initData() {
    const btnSave = document.getElementById("save")
    const labelRules = document.getElementById("rules_label")
    const areaRules = document.getElementById("rules")

    // 设置文字，html 中好像不支持 __MSG__
    btnSave.value = chrome.i18n.getMessage("options_button_save_save")
    labelRules.innerText = chrome.i18n.getMessage("options_textarea_rules_label")
    areaRules.placeholder = chrome.i18n.getMessage("options_textarea_rules_placeholder")
    // 设置点击事件
    btnSave.addEventListener("click", function () {
        btnSave.value = chrome.i18n.getMessage("options_button_save_saving")
        chrome.storage.sync.set(
            {
                "rules": areaRules.value
            },
            function () {
                btnSave.value = chrome.i18n.getMessage("options_button_save_saved")
                setTimeout(function () {
                    btnSave.value = chrome.i18n.getMessage("options_button_save_save")
                }, 1000)
            })
    })

    // 初始值
    chrome.storage.sync.get("rules", function (result) {
        const rules = result.rules
        if (rules) {
            areaRules.value = rules
        }
    })
}

initData()
