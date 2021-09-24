var
  popupButtonSettings, popupCounter, popupTextarea, popupTextareaContainer, popupFilterTabs, popupFilterTabsContainer,
  popupButtonCopy, popupButtonExport,
  popupFormat, popupLabelFormatTitles, popupLabelFormatCustom, popupLimitWindow,
  currentWindowId, os,
  optionsIgnoreNonHTTP, optionsIgnorePinned, optionsFormatCustom, optionsFilterTabs, optionsCustomHeader

var defaultPopupStates = {
  'states': {
    format: false,
    popupLimitWindow: false
  }
}

chrome.runtime.getPlatformInfo(function (info) {
  os = info.os
})

chrome.windows.getLastFocused(function (currentWindow) {
  currentWindowId = currentWindow.id
})

w.addEventListener('load', function () {
  popupCounter = d.getElementsByClassName('popup-counter')[0]
  popupFilterTabs = d.getElementsByClassName('popup-filter-tabs')[0]
  popupFilterTabsContainer = d.getElementsByClassName('popup-filter-tabs-container')[0]
  popupTextarea = d.getElementsByClassName('popup-textarea')[0]
  popupTextareaContainer = d.getElementsByClassName('popup-textarea-container')[0]
  popupFormat = d.getElementById('popup-format')
  popupLabelFormatTitles = d.getElementsByClassName('popup-label-format-titles')[0]
  popupLabelFormatCustom = d.getElementsByClassName('popup-label-format-custom')[0]
  popupLimitWindow = d.getElementById('popup-limit-window')
  popupButtonCopy = d.getElementsByClassName('popup-button-copy')[0]
  popupButtonExport = d.getElementsByClassName('popup-button-export')[0]
  popupButtonSettings = d.getElementsByClassName('popup-button-settings')[0]

  setLimitWindowVisibility()

  popupFormat.addEventListener('change', function () {
    savePopupStates()
    updatePopup()
  })

  popupButtonSettings.addEventListener('click', function () {
    chrome.runtime.openOptionsPage()
  })

  popupLimitWindow.addEventListener('change', function () {
    savePopupStates()
    updatePopup()
  })

  popupFilterTabs.addEventListener('input', function () {
    updatePopup()
  })

  popupButtonCopy.addEventListener('click', function () {
    copyToClipboard()
  })

  popupButtonExport.addEventListener('click', function () {
    download()
  })

  getOptions()
  restorePopupStates()

  localization()
})

function updatePopup () {
  chrome.tabs.query(
    {},
    function (tabs) {
      var list = ''
      var header = ''
      var format = '{url}\r\n'
      var actualNbTabs = 0
      var totalNbTabs = tabs.length
      var nbFilterMatch = 0
      var userInput = popupFilterTabs.value

      if (popupFormat.checked) format = '{title}\r\n{url}\r\n\r\n'

      if (optionsFormatCustom) {
        popupLabelFormatTitles.classList.add('hidden')
        popupLabelFormatCustom.classList.remove('hidden')

        if (popupFormat.checked) format = optionsFormatCustom.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
      }

      if (optionsFilterTabs) popupFilterTabsContainer.classList.remove('hidden')

      for (var i = 0; i < totalNbTabs; i++) {
        var tabWindowId = tabs[i].windowId
        var tabPinned = tabs[i].pinned
        var tabURL = tabs[i].url
        var tabTitle = tabs[i].title

        if (optionsIgnorePinned && tabPinned) continue
        if (popupLimitWindow.checked && tabWindowId !== currentWindowId) continue

        if ((optionsIgnoreNonHTTP && tabURL.startsWith('http')) || !optionsIgnoreNonHTTP) {
          actualNbTabs += 1

          if (filterMatch(userInput, [tabTitle, tabURL]) || userInput === '') {
            nbFilterMatch += 1

            if (/<\/?[a-zA-Z]+\/?>/.test(format)) tabTitle = tabTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

            list += format.replace(/{title}/g, tabTitle).replace(/{url}/g, tabURL).replace(/{window-id}/g, tabWindowId)
          }
        }
      }

      popupTextarea.value = ''

      if (optionsCustomHeader) {
        var nbTabs = (userInput !== '') ? nbFilterMatch : actualNbTabs

        header = optionsCustomHeader.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/{num-tabs}/g, nbTabs)

        popupTextarea.value += header + '\r\n\r\n'
      }

      popupTextarea.value += list
      popupCounter.textContent = (userInput !== '') ? nbFilterMatch + ' / ' + actualNbTabs : actualNbTabs

      setSeparatorStyle()
      popupFilterTabs.focus()
    }
  )
}

function filterMatch (needle, haystack) {
  var regex = new RegExp(needle, 'i')
  var match = false

  haystack.forEach(function (element) {
    if (regex.test(element)) match = true
  })

  return match
}

function setSeparatorStyle () {
  if (hasScrollbar(popupTextarea)) {
    popupTextareaContainer.classList.add('has-scrollbar')
  } else {
    popupTextareaContainer.classList.remove('has-scrollbar')
  }
}

function setLimitWindowVisibility () {
  chrome.windows.getAll((windowInfoArray) => {
    if (windowInfoArray.length > 1) {
      popupLimitWindow.parentNode.classList.remove('hidden')
    }
  })
}

function copyToClipboard () {
  if (popupButtonCopy.classList.contains('disabled')) return

  popupTextarea.select()

  var message = d.execCommand('copy') ? 'copiedToClipboard' : 'notCopiedToClipboard'

  chrome.notifications.create('ExportTabsURLs', {
    'type': 'basic',
    'title': chrome.i18n.getMessage('appName'),
    'iconUrl': '../img/icon.svg',
    'message': chrome.i18n.getMessage(message)
  })

  popupButtonCopy.classList.add('disabled')

  setTimeout(function () {
    chrome.notifications.clear('ExportTabsURLs')
    popupButtonCopy.classList.remove('disabled')
  }, 3000)
}

function download () {
  var list = popupTextarea.value

  // fix inconsistent behaviour on Windows, see https://github.com/alct/export-tabs-urls/issues/2
  if (os === 'win') list = list.replace(/\r?\n/g, '\r\n')

  var element = d.createElement('a')
  element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(list)
  element.download = moment().format('YYYYMMDDTHHmmssZZ') + '_ExportTabsURLs.txt'
  element.style.display = 'none'

  d.body.appendChild(element)
  element.click()
  d.body.removeChild(element)
}

function restorePopupStates () {
  chrome.storage.local.get(defaultPopupStates, (items) => {
    popupLimitWindow.checked = items.states.popupLimitWindow
    popupFormat.checked = items.states.format

    updatePopup()
  })
}

function savePopupStates () {
  chrome.storage.local.set({
    'states': {
      format: popupFormat.checked,
      popupLimitWindow: popupLimitWindow.checked
    }
  })
}

function getOptions () {
  chrome.storage.local.get(defaultOptions, (items) => {
    optionsIgnoreNonHTTP = items.options.ignoreNonHTTP
    optionsIgnorePinned = items.options.ignorePinned
    optionsFormatCustom = items.options.formatCustom
    optionsFilterTabs = items.options.filterTabs
    optionsCustomHeader = items.options.customHeader
  })
}
