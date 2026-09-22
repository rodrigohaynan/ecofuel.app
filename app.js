(function () {
  'use strict';

  var keys = {
    profiles: 'ecofuel_profiles_v2',
    history: 'ecofuel_history_v2',
    selected: 'ecofuel_selected_v2'
  };
  var form = document.getElementById('compareForm');
  var result = document.getElementById('result');
  var error = document.getElementById('formError');
  var current = null;
  var profileSelect = document.getElementById('profileSelect');
  var historyList = document.getElementById('historyList');
  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var moneyKm = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 3, maximumFractionDigits: 3 });
  var decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

  function byId(id) { return document.getElementById(id); }
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* unavailable */ }
  }
  function value(id) {
    var raw = byId(id).value.trim().replace(',', '.');
    return raw === '' ? NaN : Number(raw);
  }
  function fill(id, val) { byId(id).value = val == null ? '' : String(val); }
  function profiles() {
    var stored = read(keys.profiles, []);
    return Array.isArray(stored) ? stored.filter(function (p) {
      return p && typeof p.name === 'string' && Number.isFinite(p.gas) && p.gas > 0 && Number.isFinite(p.eth) && p.eth > 0;
    }).slice(0, 15) : [];
  }
  function history() {
    var stored = read(keys.history, []);
    return Array.isArray(stored) ? stored.filter(function (h) { return h && h.values && typeof h.date === 'number'; }).slice(0, 8) : [];
  }
  function notice(id, message) {
    var element = byId(id);
    element.textContent = message || '';
    element.hidden = !message;
  }
  function readInputs() {
    return {
      priceGas: value('priceGas'),
      priceEth: value('priceEth'),
      consumeGas: value('consumeGas'),
      consumeEth: value('consumeEth'),
      tripKm: byId('tripKm').value.trim() === '' ? null : value('tripKm'),
      monthKm: byId('monthKm').value.trim() === '' ? null : value('monthKm')
    };
  }
  function validate(v) {
    var required = ['priceGas', 'priceEth', 'consumeGas', 'consumeEth'];
    if (required.some(function (k) { return !Number.isFinite(v[k]) || v[k] <= 0; })) {
      return 'Informe preços e consumos maiores que zero para os dois combustíveis.';
    }
    if (required.some(function (k) { return v[k] > 100000; })) {
      return 'Confira os valores informados: há um número fora do intervalo esperado.';
    }
    if (['tripKm', 'monthKm'].some(function (k) { return v[k] !== null && (!Number.isFinite(v[k]) || v[k] <= 0 || v[k] > 10000000); })) {
      return 'A distância da viagem e a quilometragem mensal devem ser positivas, quando informadas.';
    }
    return '';
  }
  function invalidate() {
    current = null;
    result.hidden = true;
    notice('resultStatus', '');
    notice('formError', '');
    byId('shareFallback').hidden = true;
  }
  function saveLegacy() {
    if (byId('remember').checked) {
      try {
        localStorage.setItem('consumoGasolina', byId('consumeGas').value);
        localStorage.setItem('consumoEtanol', byId('consumeEth').value);
      } catch (e) { /* comparacao funciona sem armazenamento */ }
    } else {
      remove('consumoGasolina');
      remove('consumoEtanol');
    }
  }
  function compute(v) {
    var gas = v.priceGas / v.consumeGas;
    var eth = v.priceEth / v.consumeEth;
    var delta = gas - eth;
    var equal = Math.abs(delta) < 0.0005;
    var winner = equal ? 'equal' : delta > 0 ? 'eth' : 'gas';
    return {
      values: v, gas: gas, eth: eth, delta: delta, winner: winner,
      limit: v.priceGas * v.consumeEth / v.consumeGas
    };
  }
  function renderResult(c) {
    var saving = Math.abs(c.delta);
    result.hidden = false;
    result.classList.toggle('neutral', c.winner === 'equal');
    byId('resultKicker').textContent = c.winner === 'equal' ? 'Empate técnico' : 'Melhor custo por quilômetro';
    byId('resultTitle').textContent = c.winner === 'eth' ? 'Etanol compensa mais' : c.winner === 'gas' ? 'Gasolina compensa mais' : 'Custos praticamente iguais';
    byId('resultDescription').textContent = c.winner === 'equal'
      ? 'A diferença estimada é inferior a R$ 0,05 por 100 km. Você pode considerar outros fatores na escolha.'
      : 'Com os valores informados, você economiza aproximadamente ' + money.format(saving * 100) + ' a cada 100 km ao escolher ' + (c.winner === 'eth' ? 'etanol.' : 'gasolina.');
    byId('costGas').textContent = moneyKm.format(c.gas);
    byId('costEth').textContent = moneyKm.format(c.eth);
    byId('savings100').textContent = money.format(c.winner === 'equal' ? 0 : saving * 100);
    byId('priceLimit').textContent = money.format(c.limit) + '/L';
    byId('limitNote').textContent = 'Este é o preço de equilíbrio do etanol para o consumo informado. Abaixo dele, o etanol tem menor custo por km; acima, a gasolina.';
    var trip = c.values.tripKm;
    var month = c.values.monthKm;
    byId('tripMetric').hidden = trip === null;
    byId('monthMetric').hidden = month === null;
    if (trip !== null) {
      byId('tripLabel').textContent = 'Economia em ' + decimal.format(trip) + ' km';
      byId('savingsTrip').textContent = money.format(c.winner === 'equal' ? 0 : saving * trip);
    }
    if (month !== null) {
      byId('monthLabel').textContent = 'Economia em ' + decimal.format(month) + ' km/mês';
      byId('savingsMonth').textContent = money.format(c.winner === 'equal' ? 0 : saving * month);
    }
    current = c;
  }
  function summary(c) {
    return [
      'EcoFuel — comparação de combustíveis',
      'Gasolina: ' + money.format(c.values.priceGas) + '/L | ' + decimal.format(c.values.consumeGas) + ' km/L',
      'Etanol: ' + money.format(c.values.priceEth) + '/L | ' + decimal.format(c.values.consumeEth) + ' km/L',
      'Custo/km: gasolina ' + moneyKm.format(c.gas) + ' | etanol ' + moneyKm.format(c.eth),
      c.winner === 'equal' ? 'Resultado: custos praticamente iguais.' : 'Resultado: ' + (c.winner === 'eth' ? 'etanol' : 'gasolina') + ' tem menor custo por km.',
      'Preço de equilíbrio do etanol: ' + money.format(c.limit) + '/L',
      'Economia estimada a cada 100 km: ' + money.format(c.winner === 'equal' ? 0 : Math.abs(c.delta) * 100),
      'Estimativa baseada nos valores informados; não é cotação de postos.'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    invalidate();
    var v = readInputs();
    var problem = validate(v);
    if (problem) {
      notice('formError', problem);
      return;
    }
    saveLegacy();
    renderResult(compute(v));
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  form.addEventListener('input', invalidate);
  form.addEventListener('input', function () { byId('priceSource').hidden = true; });
  form.addEventListener('reset', function () {
    setTimeout(function () {
      invalidate();
      byId('remember').checked = true;
      byId('priceSource').hidden = true;
    }, 0);
  });

  function refreshProfiles(selectedName) {
    var items = profiles();
    profileSelect.replaceChildren();
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Escolha um veículo salvo';
    profileSelect.appendChild(placeholder);
    items.forEach(function (p) {
      var option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      profileSelect.appendChild(option);
    });
    profileSelect.value = selectedName && items.some(function (p) { return p.name === selectedName; }) ? selectedName : '';
    byId('deleteProfile').disabled = !profileSelect.value;
  }
  profileSelect.addEventListener('change', function () {
    var chosen = profiles().find(function (p) { return p.name === profileSelect.value; });
    byId('deleteProfile').disabled = !chosen;
    if (!chosen) return;
    fill('consumeGas', chosen.gas);
    fill('consumeEth', chosen.eth);
    fill('profileName', chosen.name);
    invalidate();
    write(keys.selected, chosen.name);
    notice('profileMessage', 'Consumo do veículo aplicado à calculadora.');
  });
  byId('saveProfile').addEventListener('click', function () {
    var name = byId('profileName').value.trim().replace(/\s+/g, ' ');
    var gas = value('consumeGas'), eth = value('consumeEth');
    if (!name || name.length > 40 || !Number.isFinite(gas) || !Number.isFinite(eth) || gas <= 0 || eth <= 0) {
      notice('profileMessage', 'Informe um nome (até 40 caracteres) e o consumo válido dos dois combustíveis.');
      return;
    }
    var items = profiles();
    var index = items.findIndex(function (p) { return p.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'); });
    if (index >= 0) {
      items[index] = { name: items[index].name, gas: gas, eth: eth };
      name = items[index].name;
    } else {
      if (items.length >= 15) {
        notice('profileMessage', 'Limite de 15 veículos salvos. Exclua um perfil para adicionar outro.');
        return;
      }
      items.push({ name: name, gas: gas, eth: eth });
    }
    if (!write(keys.profiles, items)) {
      notice('profileMessage', 'Não foi possível salvar neste navegador. Verifique as permissões de armazenamento.');
      return;
    }
    write(keys.selected, name);
    refreshProfiles(name);
    notice('profileMessage', 'Veículo salvo neste dispositivo.');
  });
  byId('deleteProfile').addEventListener('click', function () {
    if (!profileSelect.value) return;
    var name = profileSelect.value;
    var updated = profiles().filter(function (p) { return p.name !== name; });
    if (!write(keys.profiles, updated)) {
      notice('profileMessage', 'Não foi possível excluir o veículo neste navegador.');
      return;
    }
    remove(keys.selected);
    refreshProfiles('');
    fill('profileName', '');
    notice('profileMessage', 'Veículo excluído deste dispositivo.');
  });

  function dateLabel(time) {
    try { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(time)); }
    catch (e) { return new Date(time).toLocaleString('pt-BR'); }
  }
  function refreshHistory() {
    var items = history();
    historyList.replaceChildren();
    byId('historyEmpty').hidden = items.length > 0;
    byId('clearHistory').disabled = items.length === 0;
    items.forEach(function (item, i) {
      var entry = document.createElement('li');
      var top = document.createElement('div');
      top.className = 'item-top';
      var name = document.createElement('strong');
      name.textContent = item.winner === 'eth' ? 'Etanol' : item.winner === 'gas' ? 'Gasolina' : 'Custos equivalentes';
      var time = document.createElement('span');
      time.className = 'muted';
      time.textContent = dateLabel(item.date);
      top.append(name, time);
      var detail = document.createElement('span');
      detail.className = 'item-detail';
      detail.textContent = 'Gasolina ' + money.format(item.values.priceGas) + ' • Etanol ' + money.format(item.values.priceEth);
      var actions = document.createElement('div');
      actions.className = 'item-actions';
      var apply = document.createElement('button');
      apply.className = 'small-btn';
      apply.type = 'button';
      apply.textContent = 'Reutilizar valores';
      apply.addEventListener('click', function () {
        Object.keys(item.values).forEach(function (key) {
          if (byId(key)) fill(key, item.values[key]);
        });
        invalidate();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        byId('priceGas').focus({ preventScroll: true });
        notice('historyMessage', 'Valores recuperados. Clique em Comparar para atualizar o resultado.');
      });
      actions.appendChild(apply);
      entry.append(top, detail, actions);
      historyList.appendChild(entry);
    });
  }
  byId('saveComparison').addEventListener('click', function () {
    if (!current) return;
    var items = history();
    items.unshift({ date: Date.now(), winner: current.winner, values: current.values });
    if (!write(keys.history, items.slice(0, 8))) {
      notice('resultStatus', 'Não foi possível salvar o histórico neste navegador.');
      return;
    }
    refreshHistory();
    notice('resultStatus', 'Comparação salva neste dispositivo.');
  });
  byId('clearHistory').addEventListener('click', function () {
    remove(keys.history);
    refreshHistory();
    notice('historyMessage', 'Histórico excluído deste dispositivo.');
  });
  byId('shareComparison').addEventListener('click', async function () {
    if (!current) return;
    var output = summary(current);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'EcoFuel — minha comparação', text: output });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(output);
        notice('resultStatus', 'Resumo copiado para a área de transferência.');
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    var fallback = byId('shareFallback');
    fallback.hidden = false;
    fallback.value = output;
    fallback.focus();
    fallback.select();
    notice('resultStatus', 'Selecione e copie o resumo abaixo para compartilhar.');
  });

  refreshProfiles(read(keys.selected, ''));
  refreshHistory();
  try {
    var legacyGas = localStorage.getItem('consumoGasolina');
    var legacyEth = localStorage.getItem('consumoEtanol');
    if (legacyGas && legacyEth) {
      fill('consumeGas', legacyGas);
      fill('consumeEth', legacyEth);
    }
  } catch (e) { /* site continua utilizavel sem armazenamento */ }
  try {
    var stationPrices = sessionStorage.getItem('ecofuel_prefill_prices_v1');
    if (stationPrices) {
      sessionStorage.removeItem('ecofuel_prefill_prices_v1');
      var prices = JSON.parse(stationPrices);
      if (prices && Number.isFinite(prices.gas) && Number.isFinite(prices.eth) &&
          prices.gas > 0 && prices.eth > 0 && prices.gas <= 1000 && prices.eth <= 1000) {
        fill('priceGas', prices.gas);
        fill('priceEth', prices.eth);
        var stamp = typeof prices.observed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(prices.observed) ?
          prices.observed.slice(8, 10) + '/' + prices.observed.slice(5, 7) + '/' + prices.observed.slice(0, 4) :
          'data não informada';
        byId('priceSource').textContent = 'Preços anotados por você em ' + stamp +
          '. Valores não verificados: confira-os no posto antes de abastecer.';
        byId('priceSource').hidden = false;
      }
    }
  } catch (e) { /* a calculadora continua funcionando sem dados predefinidos */ }
}());
