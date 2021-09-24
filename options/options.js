var optionsFormatCustom, optionsIgnoreNonHTTP, optionsIgnorePinned, optionsButtonResetFormat, optionsFilterTabs, optionsCustomHeader, optionsButtonResetHeader

w.addEventListener('load', function () {
  optionsIgnoreNonHTTP = d.getElementById('options-ignore-non-http')
  optionsIgnorePinned = d.getElementById('options-ignore-pinned')
  optionsFormatCustom = d.getElementById('options-format-custom')
  optionsButtonResetFormat = d.getElementById('options-button-reset-format')
  optionsFilterTabs = d.getElementById('options-filter-tabs')
  optionsCustomHeader = d.getElementById('options-custom-header')
  optionsButtonResetHeader = d.getElementById('options-button-reset-header')

  optionsIgnoreNonHTTP.addEventListener('change', function () {
    saveOptions()
  })

  optionsIgnorePinned.addEventListener('change', function () {
    saveOptions()
  })

  optionsButtonResetFormat.addEventListener('click', function () {
    optionsFormatCustom.value = ''
    saveOptions()
    setOptionsButtonResetFormatVisibility()
  })

  optionsFormatCustom.addEventListener('input', function () {
    saveOptions()
    setOptionsButtonResetFormatVisibility()
  })

  optionsFilterTabs.addEventListener('change', function () {
    saveOptions()
  })

  optionsButtonResetHeader.addEventListener('click', function () {
    optionsCustomHeader.value = ''
    saveOptions()
    setOptionsButtonResetHeaderVisibility()
  })

  optionsCustomHeader.addEventListener('input', function () {
    saveOptions()
    setOptionsButtonResetHeaderVisibility()
  })

  restoreOptions()
  localization()
})

function setOptionsButtonResetFormatVisibility () {
  if (optionsFormatCustom.value !== '') {
    optionsButtonResetFormat.classList.remove('hidden')
  } else {
    optionsButtonResetFormat.classList.add('hidden')
  }
}

function setOptionsButtonResetHeaderVisibility () {
  if (optionsCustomHeader.value !== '') {
    optionsButtonResetHeader.classList.remove('hidden')
  } else {
    optionsButtonResetHeader.classList.add('hidden')
  }
}

function restoreOptions () {
  chrome.storage.local.get(defaultOptions, (items) => {
    optionsIgnoreNonHTTP.checked = items.options.ignoreNonHTTP
    optionsIgnorePinned.checked = items.options.ignorePinned
    optionsFormatCustom.value = items.options.formatCustom
    optionsFilterTabs.checked = items.options.filterTabs
    optionsCustomHeader.value = items.options.customHeader

    setOptionsButtonResetFormatVisibility()
    setOptionsButtonResetHeaderVisibility()
  })
}

function saveOptions () {
  chrome.storage.local.set({
    'options': {
      ignoreNonHTTP: optionsIgnoreNonHTTP.checked,
      ignorePinned: optionsIgnorePinned.checked,
      formatCustom: optionsFormatCustom.value,
      filterTabs: optionsFilterTabs.checked,
      customHeader: optionsCustomHeader.value
    }
  })
}
