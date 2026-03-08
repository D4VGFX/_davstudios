document.addEventListener('DOMContentLoaded', function () {

  
  var rows      = Array.from(document.querySelectorAll('.p-row'));
  var panel     = document.getElementById('panel');
  var backdrop  = document.getElementById('backdrop');
  var noResults = document.getElementById('no-results');
  var preview   = document.getElementById('cursor-preview');

  var visibleRows   = rows.slice();
  var activeIdx     = 0;
  var currentFilter = 'all';

  
  function renumber(list) {
    list.forEach(function (row, i) {
      var el = row.querySelector('.p-num');
      if (el) el.textContent = String(i + 1).padStart(2, '0');
    });
  }

  
  var total   = rows.length;
  var graphic = rows.filter(function(r){ return r.getAttribute('data-category') === 'graphic'; }).length;
  var web     = rows.filter(function(r){ return r.getAttribute('data-category') === 'web'; }).length;
  document.getElementById('b-all').textContent     = total;
  document.getElementById('b-graphic').textContent = graphic;
  document.getElementById('b-web').textContent     = web;

  
  document.querySelectorAll('.f-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');
      if (filter === currentFilter) return;
      currentFilter = filter;

      
      document.querySelectorAll('.f-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      
      var shown = [];
      rows.forEach(function (row) {
        var cat   = row.getAttribute('data-category');
        var match = (filter === 'all') || (cat === filter);
        row.style.display = match ? '' : 'none';
        if (match) shown.push(row);
      });

      visibleRows = shown;
      renumber(shown);
      noResults.style.display = shown.length === 0 ? 'block' : 'none';
    });
  });

  
  document.addEventListener('mousemove', function (e) {
    preview.style.left = e.clientX + 'px';
    preview.style.top  = e.clientY + 'px';
  });

  rows.forEach(function (row) {
    row.addEventListener('mouseenter', function () {
      preview.classList.add('show');
    });
    row.addEventListener('mouseleave', function () {
      preview.classList.remove('show');
    });
  });

  
  function fillPanel(row) {
    var cat   = row.getAttribute('data-category');
    var label = cat === 'graphic' ? 'Graphic Design' : 'Web Developing';

    document.getElementById('panel-cat').textContent   = label;
    document.getElementById('panel-title').textContent = row.getAttribute('data-title') || '';
    document.getElementById('panel-role').textContent  = row.getAttribute('data-role')  || '—';
    document.getElementById('panel-year').textContent  = row.getAttribute('data-year')  || '—';
    document.getElementById('panel-desc').textContent  = row.getAttribute('data-desc')  || '';

    
    var idx = visibleRows.indexOf(row);
    if (idx !== -1) activeIdx = idx;
    document.getElementById('nav-ctr').textContent = (activeIdx + 1) + ' / ' + visibleRows.length;

    
    var lnk  = document.getElementById('panel-link');
    var href = row.getAttribute('data-link');
    if (href && href !== '#') {
      lnk.href = href;
      lnk.style.display = '';
    } else {
      lnk.style.display = 'none';
    }

    
    var tagsEl = document.getElementById('panel-tags');
    tagsEl.innerHTML = '';
    var tagsRaw = row.getAttribute('data-tags') || '';
    tagsRaw.split(',').forEach(function (t) {
      t = t.trim();
      if (!t) return;
      var s = document.createElement('span');
      s.className   = 'p-tag';
      s.textContent = t;
      tagsEl.appendChild(s);
    });

    
    var imgSlot = document.getElementById('panel-img');
    var oldImg  = imgSlot.querySelector('img');
    if (oldImg) oldImg.remove();
    var imgSrc = row.getAttribute('data-img');
    if (imgSrc) {
      var img = document.createElement('img');
      img.src = imgSrc;
      img.alt = row.getAttribute('data-title') || '';
      imgSlot.appendChild(img);
    }
  }

  
  function openPanel(row) {
    fillPanel(row);
    panel.classList.add('show');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('show');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      openPanel(row);
    });
  });

  
  document.getElementById('btn-close').addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  
  document.getElementById('btn-prev').addEventListener('click', function () {
    if (!visibleRows.length) return;
    activeIdx = (activeIdx - 1 + visibleRows.length) % visibleRows.length;
    fillPanel(visibleRows[activeIdx]);
  });

  document.getElementById('btn-next').addEventListener('click', function () {
    if (!visibleRows.length) return;
    activeIdx = (activeIdx + 1) % visibleRows.length;
    fillPanel(visibleRows[activeIdx]);
  });

  
  document.addEventListener('keydown', function (e) {
    var open = panel.classList.contains('show');
    if (e.key === 'Escape' && open) { closePanel(); return; }
    if (!open || !visibleRows.length) return;
    if (e.key === 'ArrowDown'  || e.key === 'ArrowRight') {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % visibleRows.length;
      fillPanel(visibleRows[activeIdx]);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + visibleRows.length) % visibleRows.length;
      fillPanel(visibleRows[activeIdx]);
    }
  });

  
  renumber(rows);

});