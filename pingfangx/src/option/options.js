function initData() {
    // 设置文字，html 中好像不支持 __MSG__
    document.getElementById("title_copy").innerText
        = chrome.i18n.getMessage("background_menu_copy")
    document.getElementById("title_copy_as_reference").innerText
        = chrome.i18n.getMessage("background_menu_copy_reference")

    const cbIncludeReferenceType = document.getElementById("cb_include_reference_type")
    document.getElementById("label_include_reference_type").innerText
        = chrome.i18n.getMessage("options_label_include_reference_type")
    const cbIncludeReferenceDate = document.getElementById("cb_include_reference_date")
    document.getElementById("label_include_reference_date").innerText
        = chrome.i18n.getMessage("options_label_include_reference_date")

    document.getElementById("label_rules").innerText
        = chrome.i18n.getMessage("options_label_textarea_rules")

    const areaRules = document.getElementById("rules")
    areaRules.placeholder = chrome.i18n.getMessage("options_textarea_rules_placeholder")

    const btnSave = document.getElementById("save")
    btnSave.value = chrome.i18n.getMessage("options_button_save_save")
    // 设置点击事件
    btnSave.addEventListener("click", function () {
        btnSave.value = chrome.i18n.getMessage("options_button_save_saving")
        chrome.storage.sync.set(
            {
                "rules": areaRules.value,
                "includeReferenceType": cbIncludeReferenceType.checked,
                "includeReferenceDate": cbIncludeReferenceDate.checked,
            },
            function () {
                btnSave.value = chrome.i18n.getMessage("options_button_save_saved")
                setTimeout(function () {
                    btnSave.value = chrome.i18n.getMessage("options_button_save_save")
                }, 1000)
            })
    })

    // 初始值
    chrome.storage.sync.get(null, function (result) {
        if (result.rules) {
            areaRules.value = result.rules
        }
        cbIncludeReferenceType.checked = Boolean(result.includeReferenceType)
        cbIncludeReferenceDate.checked = Boolean(result.includeReferenceDate)
    })
}

initData()
