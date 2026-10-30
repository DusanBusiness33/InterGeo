/* INTERGEO: Google ocena, broj recenzija i prave recenzije, uživo sa Google mapa.
   Podaci se traže od Google-a pri svakom otvaranju stranice i nigde se ne čuvaju (pravilo Google Places API-ja).
   Bez ključa, kad se potroši dnevna kvota ili kad Google ne odgovori, na stranici ostaje tekst bez broja
   i link ka recenzijama na Google mapama. Nikad star ili ručno upisan broj. */
(function () {
  var KLJUC = ''; // Google API ključ, ograničen na adresu sajta (Places API (New) + Maps JavaScript API)
  var MESTO = 'ChIJj9ctrYd7WkcRUtGckUCigCw'; // INTERGEO na Google mapama
  var NAJVISE = 6;

  if (!KLJUC) return;
  var badge = document.querySelector('[data-g-badge]');
  var naslov = document.querySelector('[data-g-naslov]');
  var lista = document.getElementById('g-recenzije');
  var sve = document.querySelector('[data-g-sve]');
  if (!badge && !naslov && !lista) return;

  function recenzija(n) {
    var d = n % 10, s = n % 100;
    var rec = (d >= 2 && d <= 4 && (s < 12 || s > 14)) ? 'recenzije' : 'recenzija';
    return n.toLocaleString('sr-RS') + ' ' + rec;
  }
  function ocena(r) { return r.toFixed(1).replace('.', ','); }
  function zvezde(r, oznaka) {
    var pune = Math.round(r), h = '<span class="stars"' + (oznaka ? ' role="img" aria-label="Ocena ' + pune + ' od 5"' : ' aria-hidden="true"') + '>';
    for (var i = 1; i <= 5; i++) h += '<svg' + (i > pune ? ' class="off"' : '') + '><use href="#i-star"/></svg>';
    return h + '</span>';
  }
  function el(tag, klasa, tekst) {
    var e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst != null) e.textContent = tekst;
    return e;
  }
  function link(href, tekst) {
    var a = el('a', '', tekst);
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }

  function prikazi(p) {
    var r = p.rating, n = p.userRatingCount;
    var mapa = p.googleMapsURI || p.googleMapsUri || ('https://www.google.com/maps/place/?q=place_id:' + MESTO);
    if (!r || !n) return;
    var tekst = recenzija(n) + ' na Google mapama';

    if (badge) {
      badge.innerHTML = '<b>' + ocena(r) + '</b>' + zvezde(r, false) + '<span></span>';
      badge.lastChild.textContent = tekst;
      badge.setAttribute('aria-label', 'Ocena ' + ocena(r) + ' od 5, ' + tekst);
      badge.href = mapa;
    }
    if (naslov) naslov.textContent = tekst.charAt(0).toUpperCase() + tekst.slice(1) + ', prosečna ocena ' + ocena(r);
    if (sve) sve.href = mapa;

    var rev = (p.reviews || []).filter(function (x) { return (x.originalText || x.text); }).slice(0, NAJVISE);
    if (!lista || !rev.length) return;
    lista.textContent = '';
    rev.forEach(function (x) {
      var autor = x.authorAttribution || {};
      var f = el('figure', 'review g-review'); f.style.margin = '0';

      var glava = el('div', 'g-autor');
      var foto = autor.photoURI || autor.photoUri;
      if (foto) {
        var img = el('img'); img.src = foto; img.alt = ''; img.width = 40; img.height = 40;
        img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
        glava.appendChild(img);
      }
      var ko = el('div');
      var cite = el('cite');
      if (autor.uri) cite.appendChild(link(autor.uri, autor.displayName || 'Korisnik Google mapa'));
      else cite.textContent = autor.displayName || 'Korisnik Google mapa';
      ko.appendChild(cite);
      if (x.relativePublishTimeDescription) ko.appendChild(el('span', '', x.relativePublishTimeDescription));
      glava.appendChild(ko);
      f.appendChild(glava);

      var z = el('span'); z.innerHTML = zvezde(x.rating || 0, true); f.appendChild(z.firstChild);
      f.appendChild(el('blockquote', '', x.originalText || x.text));

      var noga = el('footer');
      noga.appendChild(el('span', '', 'Google mape'));
      noga.appendChild(link(x.googleMapsURI || x.googleMapsUri || mapa, 'Pogledajte original'));
      f.appendChild(noga);
      lista.appendChild(f);
    });
    lista.hidden = false;
  }

  function kreni() {
    window.__intergeoGoogle = function () {
      google.maps.importLibrary('places').then(function (lib) {
        var p = new lib.Place({ id: MESTO, requestedLanguage: 'sr' });
        var polja = ['rating', 'userRatingCount', 'googleMapsURI'];
        if (lista) polja.push('reviews');
        return p.fetchFields({ fields: polja }).then(function () { prikazi(p); });
      }).catch(function () { /* ostaje tekst bez broja */ });
    };
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(KLJUC) +
      '&v=weekly&language=sr&region=RS&loading=async&callback=__intergeoGoogle';
    s.async = true;
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') kreni(); else window.addEventListener('load', kreni);
})();
