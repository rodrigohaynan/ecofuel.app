(function () {
  'use strict';

  var KEYS = {
    fillups: 'ecofuel_fillups_v1',
    stations: 'ecofuel_stations_v1',
    profiles: 'ecofuel_profiles_v2',
    comparisons: 'ecofuel_history_v2',
    legacyGas: 'consumoGasolina',
    legacyEth: 'consumoEtanol',
    prefill: 'ecofuel_prefill_prices_v1'
  };
  var money = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
  var decimal = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 3});
  var $ = function (id) { return document.getElementById(id); };
  var today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var dateOK = function (s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s > today()) return false;
    var d = new Date(s + 'T12:00:00');
    return Number.isFinite(d.getTime()) && d.getFullYear() === Number(s.slice(0, 4)) && d.getMonth() + 1 === Number(s.slice(5, 7)) && d.getDate() === Number(s.slice(8, 10));
  };
  var shortDate = function (s) { return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4); };
  var get = function (key, fallback) {
    try { var value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
    catch (err) { return fallback; }
  };
  var store = function (key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  };
  var number = function (id) {
    var text = $(id).value.trim().replace(',', '.');
    return text ? Number(text) : NaN;
  };
  var nonempty = function (id) { return $(id).value.trim().replace(/\s+/g, ' '); };
  var priceValid = function (n) { return Number.isFinite(n) && n > 0 && n <= 1000; };
  var validFill = function (f) {
    return f && typeof f.id === 'string' && f.id.length <= 100 && dateOK(f.date) &&
      typeof f.vehicle === 'string' && f.vehicle.length > 0 && f.vehicle.length <= 60 &&
      (f.fuel === 'gasolina' || f.fuel === 'etanol') &&
      typeof f.station === 'string' && f.station.length <= 80 &&
      Number.isFinite(f.liters) && f.liters > 0 && f.liters <= 2000 &&
      priceValid(f.unitPrice) && Number.isFinite(f.total) && f.total > 0 &&
      f.total <= 2000000 && (f.odometer === null || (Number.isFinite(f.odometer) && f.odometer >= 0 && f.odometer <= 100000000));
  };
  var validStation = function (s) {
    return s && typeof s.id === 'string' && s.id.length <= 100 &&
      typeof s.name === 'string' && s.name.length > 0 && s.name.length <= 80 &&
      typeof s.city === 'string' && s.city.length > 0 && s.city.length <= 80 &&
      dateOK(s.observed) &&
      (s.gas === null || priceValid(s.gas)) && (s.eth === null || priceValid(s.eth)) &&
      (priceValid(s.gas) || priceValid(s.eth));
  };
  var safeList = function (key, validator, max) {
    var list = get(key, []);
    return Array.isArray(list) ? list.filter(validator).slice(0, max) : [];
  };
  var fillups = function () { return safeList(KEYS.fillups, validFill, 300); };
  var stations = function () { return safeList(KEYS.stations, validStation, 100); };
  var message = function (id, text, isError) {
    var el = $(id);
    el.hidden = !text;
    el.textContent = text || '';
    el.classList.toggle('error', !!isError);
  };
  var uid = function () {
    return typeof crypto !== 'undefined' && crypto.randomUUID ?
      crypto.randomUUID() : String(Date.now()) + '-' + String(Math.random()).slice(2);
  };
  var node = function (tag, value, className) {
    var el = document.createElement(tag);
    if (value !== undefined && value !== null) el.textContent = String(value);
    if (className) el.className = className;
    return el;
  };
  var safeFilter = function (f) {
    return (!$('filterVehicle').value || f.vehicle === $('filterVehicle').value) &&
      (!$('filterMonth').value || f.date.slice(0, 7) === $('filterMonth').value);
  };
  var sortedFillups = function (list) {
    return list.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
  };
  function refreshOptions() {
    var active = $('filterVehicle').value;
    var names = new Set();
    fillups().forEach(function (f) { names.add(f.vehicle); });
    var profiles = get(KEYS.profiles, []);
    if (Array.isArray(profiles)) profiles.forEach(function (p) {
      if (p && typeof p.name === 'string' && p.name.length <= 60 && p.name.trim()) names.add(p.name);
    });
    var options = Array.from(names).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    var select = $('filterVehicle');
    select.replaceChildren(new Option('Todos os veículos', ''));
    var list = $('savedVehicles');
    list.replaceChildren();
    options.forEach(function (name) {
      select.add(new Option(name, name));
      var choice = node('option');
      choice.value = name;
      list.appendChild(choice);
    });
    select.value = options.includes(active) ? active : '';
    var saved = $('savedStations');
    saved.replaceChildren();
    stations().forEach(function (s) {
      var option = node('option');
      option.value = s.name;
      saved.appendChild(option);
    });
  }
  function updateTotal() {
    var liters = number('fillLiters'), price = number('fillPrice');
    $('fillTotal').value = liters > 0 && price > 0 && Number.isFinite(liters * price) ?
      money.format(Math.round(liters * price * 100) / 100) : '';
  }
  function renderOverview() {
    var rows = fillups().filter(safeFilter);
    var total = rows.reduce(function (sum, f) { return sum + f.total; }, 0);
    var liters = rows.reduce(function (sum, f) { return sum + f.liters; }, 0);
    $('totalSpent').textContent = money.format(total);
    $('totalLiters').textContent = decimal.format(liters) + ' L';
    $('avgPrice').textContent = liters > 0 ? money.format(total / liters) : '—';
    $('totalEntries').textContent = String(rows.length);
    renderHistory(rows);
    var byMonth = new Map();
    fillups().filter(function (f) {
      return !$('filterVehicle').value || f.vehicle === $('filterVehicle').value;
    }).forEach(function (f) {
      var month = f.date.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) || 0) + f.total);
    });
    var periods = Array.from(byMonth).sort(function (a, b) { return a[0].localeCompare(b[0]); }).slice(-6);
    $('chartEmpty').hidden = periods.length > 0;
    $('expenseChart').replaceChildren();
    var max = Math.max(1, ...periods.map(function (v) { return v[1]; }));
    periods.forEach(function (pair) {
      var row = node('div', null, 'chart-line');
      var label = node('span', pair[0].slice(5, 7) + '/' + pair[0].slice(0, 4));
      var track = node('div', null, 'chart-track');
      var bar = node('div', null, 'chart-fill');
      bar.style.width = (100 * pair[1] / max) + '%';
      track.appendChild(bar);
      row.append(label, track, node('span', money.format(pair[1])));
      $('expenseChart').appendChild(row);
    });
    $('expenseChart').setAttribute('aria-label', periods.length ?
      'Gastos mensais: ' + periods.map(function (p) { return p[0] + ' ' + money.format(p[1]); }).join('; ') :
      'Nenhum gasto registrado');
  }
  function renderHistory(rows) {
    var list = $('fillList');
    list.replaceChildren();
    $('fillEmpty').hidden = rows.length > 0;
    sortedFillups(rows).forEach(function (f) {
      var li = node('li');
      var top = node('div', null, 'dash-row');
      var left = node('div');
      left.appendChild(node('strong', f.vehicle + ' · ' + (f.fuel === 'gasolina' ? 'Gasolina' : 'Etanol')));
      left.appendChild(node('span', shortDate(f.date) + (f.station ? ' · ' + f.station : ''), 'dash-meta'));
      top.append(left, node('span', money.format(f.total), 'amount'));
      li.appendChild(top);
      li.appendChild(node('span', decimal.format(f.liters) + ' L · ' + money.format(f.unitPrice) + '/L' +
        (f.odometer === null ? '' : ' · Odômetro: ' + decimal.format(f.odometer) + ' km'), 'dash-meta'));
      var actions = node('div', null, 'dash-row-actions');
      var button = node('button', 'Excluir registro', 'small-btn');
      button.type = 'button';
      button.addEventListener('click', function () {
        if (!window.confirm('Excluir este abastecimento do seu histórico?')) return;
        var newRows = fillups().filter(function (item) { return item.id !== f.id; });
        if (!store(KEYS.fillups, newRows)) {
          message('historyMessage', 'Não foi possível excluir o registro neste navegador.', true);
          return;
        }
        message('historyMessage', 'Registro excluído.');
        refreshOptions();
        renderOverview();
      });
      actions.appendChild(button);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }
  function renderStations() {
    var list = $('stationList');
    list.replaceChildren();
    var saved = stations().sort(function (a, b) {
      return b.observed.localeCompare(a.observed) || a.name.localeCompare(b.name, 'pt-BR');
    });
    $('stationEmpty').hidden = saved.length > 0;
    saved.forEach(function (s) {
      var li = node('li');
      var row = node('div', null, 'dash-row');
      var left = node('div');
      left.appendChild(node('strong', s.name));
      left.appendChild(node('span', s.city + ' · preço anotado em ' + shortDate(s.observed), 'dash-meta'));
      var prices = node('span', (s.gas !== null ? 'Gasolina ' + money.format(s.gas) : 'Gasolina: não informada') +
        ' · ' + (s.eth !== null ? 'Etanol ' + money.format(s.eth) : 'Etanol: não informado'), 'dash-meta');
      left.appendChild(prices);
      left.appendChild(node('span', 'Informado por você · não verificado', 'dash-badge'));
      row.appendChild(left);
      li.appendChild(row);
      var actions = node('div', null, 'dash-row-actions');
      if (s.gas !== null && s.eth !== null) {
        var use = node('button', 'Comparar estes preços', 'small-btn');
        use.type = 'button';
        use.addEventListener('click', function () {
          try {
            sessionStorage.setItem(KEYS.prefill, JSON.stringify({gas: s.gas, eth: s.eth, observed: s.observed}));
            window.location.assign('index.html#calculadora');
          } catch (err) {
            message('stationMessage', 'Seu navegador bloqueou o envio dos preços à calculadora.', true);
          }
        });
        actions.appendChild(use);
      }
      var del = node('button', 'Excluir posto', 'small-btn');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Excluir este posto e os preços anotados?')) return;
        if (!store(KEYS.stations, stations().filter(function (item) { return item.id !== s.id; }))) {
          message('stationMessage', 'Não foi possível excluir o posto.', true);
          return;
        }
        message('stationMessage', 'Posto excluído.');
        refreshOptions();
        renderStations();
      });
      actions.appendChild(del);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }
  function init() {
    $('fillDate').value = today();
    $('stationObserved').value = today();
    $('fillDate').max = today();
    $('stationObserved').max = today();
    refreshOptions();
    renderOverview();
    renderStations();
  }
  $('fillLiters').addEventListener('input', updateTotal);
  $('fillPrice').addEventListener('input', updateTotal);
  $('fillupForm').addEventListener('reset', function () {
    setTimeout(function () { $('fillDate').value = today(); updateTotal(); message('fillMessage', ''); }, 0);
  });
  $('fillupForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var f = {
      id: uid(),
      date: $('fillDate').value,
      vehicle: nonempty('fillVehicle'),
      fuel: $('fillFuel').value,
      station: nonempty('fillStation'),
      liters: number('fillLiters'),
      unitPrice: number('fillPrice'),
      total: Math.round(number('fillLiters') * number('fillPrice') * 100) / 100,
      odometer: $('fillOdometer').value.trim() === '' ? null : number('fillOdometer')
    };
    if (!validFill(f)) {
      message('fillMessage', 'Confira a data, o veículo, os litros e o preço por litro. Use valores positivos e evite números fora dos limites.', true);
      return;
    }
    var items = fillups();
    if (items.length >= 300) {
      message('fillMessage', 'Limite de 300 registros atingido. Exporte um backup e exclua registros antigos para continuar.', true);
      return;
    }
    items.push(f);
    if (!store(KEYS.fillups, items)) {
      message('fillMessage', 'Não foi possível salvar no armazenamento deste navegador.', true);
      return;
    }
    $('fillupForm').reset();
    setTimeout(function () { message('fillMessage', 'Abastecimento salvo neste dispositivo.'); }, 0);
    refreshOptions();
    renderOverview();
  });
  $('filterVehicle').addEventListener('change', renderOverview);
  $('filterMonth').addEventListener('change', renderOverview);
  $('clearFilters').addEventListener('click', function () {
    $('filterVehicle').value = '';
    $('filterMonth').value = '';
    renderOverview();
  });
  $('stationForm').addEventListener('reset', function () {
    setTimeout(function () { $('stationObserved').value = today(); message('stationMessage', ''); }, 0);
  });
  $('stationForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var name = nonempty('stationName'), city = nonempty('stationCity');
    var gas = $('stationGas').value.trim() ? number('stationGas') : null;
    var eth = $('stationEth').value.trim() ? number('stationEth') : null;
    var existing = stations();
    var key = function (text) { return text.trim().toLocaleLowerCase('pt-BR'); };
    var previous = existing.find(function (s) { return key(s.name) === key(name) && key(s.city) === key(city); });
    var s = {id: previous ? previous.id : uid(), name: name, city: city, observed: $('stationObserved').value, gas: gas, eth: eth};
    if (!validStation(s)) {
      message('stationMessage', 'Informe o nome, cidade, data válida e preço positivo de pelo menos um combustível.', true);
      return;
    }
    if (previous && s.observed < previous.observed && !window.confirm('O novo registro é mais antigo que o preço já salvo. Substituir mesmo assim?')) return;
    if (!previous && existing.length >= 100) {
      message('stationMessage', 'Limite de 100 postos alcançado. Exclua um posto para adicionar outro.', true);
      return;
    }
    var updated = existing.filter(function (item) { return item.id !== s.id; });
    updated.push(s);
    if (!store(KEYS.stations, updated)) {
      message('stationMessage', 'Não foi possível salvar o posto neste navegador.', true);
      return;
    }
    $('stationForm').reset();
    message('stationMessage', previous ? 'Preços atualizados neste dispositivo.' : 'Posto adicionado aos favoritos.');
    refreshOptions();
    renderStations();
  });
  var mapsLink = function (place) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('postos de combustivel perto de ' + place); };
  $('nearbyStations').addEventListener('click', function () {
    if (!('geolocation' in navigator)) {
      message('locationMessage', 'Seu navegador não oferece localização. Use a busca por cidade ou bairro.', true);
      return;
    }
    message('locationMessage', 'Aguardando sua autorização de localização…');
    navigator.geolocation.getCurrentPosition(function (position) {
      var lat = position.coords.latitude, lon = position.coords.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        message('locationMessage', 'Localização indisponível. Tente buscar por cidade.', true);
        return;
      }
      window.location.assign(mapsLink(lat.toFixed(5) + ',' + lon.toFixed(5)));
    }, function () {
      message('locationMessage', 'Não foi possível obter a localização. Use a busca por cidade ou bairro.', true);
    }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 300000});
  });
  $('searchLocation').addEventListener('click', function () {
    var place = nonempty('manualLocation');
    if (place.length < 3) {
      message('locationMessage', 'Informe ao menos três caracteres de cidade ou bairro.', true);
      return;
    }
    window.location.assign(mapsLink(place));
  });

  function exportBackup() {
    var backup = {
      format: 'ecofuel-backup', version: 1, exportedAt: new Date().toISOString(),
      fillups: fillups(), stations: stations(),
      profiles: get(KEYS.profiles, []), comparisons: get(KEYS.comparisons, []),
      legacyConsumption: {gas: null, eth: null}
    };
    try {
      backup.legacyConsumption.gas = localStorage.getItem(KEYS.legacyGas);
      backup.legacyConsumption.eth = localStorage.getItem(KEYS.legacyEth);
      var blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
      var url = URL.createObjectURL(blob);
      var link = node('a');
      link.href = url;
      link.download = 'ecofuel-backup-' + today() + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      message('backupMessage', 'Arquivo de backup preparado para download.');
    } catch (err) { message('backupMessage', 'Não foi possível gerar o backup.', true); }
  }
  $('exportData').addEventListener('click', exportBackup);
  $('importData').addEventListener('change', async function () {
    var picker = this;
    var file = picker.files && picker.files[0];
    picker.value = '';
    if (!file) return;
    if (file.size > 1000000) {
      message('backupMessage', 'O arquivo excede o tamanho máximo de 1 MB.', true);
      return;
    }
    try {
      var data = JSON.parse(await file.text());
      if (!data || data.format !== 'ecofuel-backup' || data.version !== 1 ||
          !Array.isArray(data.fillups) || data.fillups.length > 300 ||
          !data.fillups.every(validFill) || !Array.isArray(data.stations) ||
          data.stations.length > 100 || !data.stations.every(validStation) ||
          !Array.isArray(data.profiles) || data.profiles.length > 15 ||
          !data.profiles.every(function (p) {
            return p && typeof p.name === 'string' && p.name.length > 0 && p.name.length <= 60 &&
              Number.isFinite(p.gas) && p.gas > 0 && Number.isFinite(p.eth) && p.eth > 0;
          }) ||
          !Array.isArray(data.comparisons) || data.comparisons.length > 8 ||
          !data.comparisons.every(function (c) {
            return c && typeof c.date === 'number' && Number.isFinite(c.date) &&
              (c.winner === 'eth' || c.winner === 'gas' || c.winner === 'equal') &&
              c.values && ['priceGas', 'priceEth', 'consumeGas', 'consumeEth'].every(function (k) {
                return Number.isFinite(c.values[k]) && c.values[k] > 0 && c.values[k] <= 100000;
              });
          }) ||
          !data.legacyConsumption || ['gas', 'eth'].some(function (k) {
            var v = data.legacyConsumption[k];
            return v !== null && (typeof v !== 'string' || v.length > 30 || !Number.isFinite(Number(v)) || Number(v) <= 0);
          })) {
        message('backupMessage', 'Arquivo não reconhecido ou com informações inválidas. Nenhum dado foi substituído.', true);
        return;
      }
      if (!window.confirm('Restaurar backup? Os abastecimentos, postos, veículos e comparações atuais deste navegador serão substituídos.')) return;
      var previous = {};
      Object.keys(KEYS).filter(function (name) { return name !== 'prefill'; }).forEach(function (name) {
        var key = KEYS[name];
        previous[key] = localStorage.getItem(key);
      });
      try {
        localStorage.setItem(KEYS.fillups, JSON.stringify(data.fillups));
        localStorage.setItem(KEYS.stations, JSON.stringify(data.stations));
        localStorage.setItem(KEYS.profiles, JSON.stringify(data.profiles));
        localStorage.setItem(KEYS.comparisons, JSON.stringify(data.comparisons));
        ['gas', 'eth'].forEach(function (k) {
          var key = k === 'gas' ? KEYS.legacyGas : KEYS.legacyEth;
          if (data.legacyConsumption[k] === null) localStorage.removeItem(key);
          else localStorage.setItem(key, data.legacyConsumption[k]);
        });
      } catch (err) {
        Object.keys(previous).forEach(function (key) {
          try { if (previous[key] === null) localStorage.removeItem(key); else localStorage.setItem(key, previous[key]); }
          catch (ignored) { /* best effort rollback */ }
        });
        message('backupMessage', 'A restauração falhou. Verifique o espaço de armazenamento do navegador.', true);
        return;
      }
      refreshOptions();
      $('filterMonth').value = '';
      renderOverview();
      renderStations();
      message('backupMessage', 'Backup restaurado neste navegador. Reabra a calculadora para conferir os veículos e comparações.');
    } catch (err) { message('backupMessage', 'Não foi possível ler o arquivo JSON selecionado.', true); }
  });
  init();
}());
