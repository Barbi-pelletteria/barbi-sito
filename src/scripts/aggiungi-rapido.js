// "Aggiungi al carrello" dalle card (home e collezione), D-029 § 4.1
// [VENDITA ACCESA]. Un solo gestore per i due componenti (VetrinaProdotti
// e ProductCard): colore e pelle vengono dalla pastiglia attiva della card
// se c'è (collezione), altrimenti dal colore di vetrina scritto sul
// pulsante (home). La pelle è quella iniziale del colore (la prima con
// stock): per scegliere un'altra pelle si passa dalla scheda prodotto.
// Non supera mai lo stock reale della variante colore+pelle — stesso conto
// già usato sulla scheda prodotto (residuo = stock meno pezzi già nel
// carrello), stesso messaggio.
import { addToCart, getQuantitaVariante } from './cart.js';
import { trackEvent } from './analytics.js';

let toast = null;
let toastTimer = null;

function mostraToast(messaggio) {
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.hidden = true;
    document.body.appendChild(toast);
  }
  toast.textContent = messaggio;
  toast.hidden = false;
  toast.classList.add('toast--visibile');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visibile');
    setTimeout(() => { toast.hidden = true; }, 200);
  }, 2500);
}

export function initAggiungiRapido() {
  document.querySelectorAll('.v-aggiungi').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scheda = btn.closest('[data-scheda]');
      const swAttivo = scheda?.querySelector('.sw.on');
      const slug = btn.dataset.slug;
      const colore = swAttivo?.getAttribute('data-c') || btn.dataset.colore;
      const coloreNome = swAttivo?.getAttribute('data-nome') || btn.dataset.coloreNome;
      const pelle = swAttivo?.getAttribute('data-pelle') || btn.dataset.pelle || '';
      const pelleNome = swAttivo?.getAttribute('data-pelle-nome') || btn.dataset.pelleNome || '';
      // data-stock sulla pastiglia/pulsante è lo stock della variante
      // colore + pelle iniziale, non del colore intero.
      const stock = Number(swAttivo?.getAttribute('data-stock') ?? btn.dataset.stock ?? 0);
      const rimasti = Math.max(0, stock - getQuantitaVariante(slug, colore, pelle));
      if (rimasti === 0) {
        mostraToast(`Puoi aggiungerne al massimo ${stock} in questa pelle e colore.`);
        return;
      }
      addToCart({ slug, colore, pelle, iniziali: '', quantita: 1 });
      trackEvent('add_to_cart', {
        currency: 'EUR',
        items: [{
          item_id: slug,
          item_name: btn.dataset.nome,
          item_variant: [coloreNome, pelleNome].filter(Boolean).join(' / '),
          quantity: 1,
        }],
      });
      mostraToast(`${btn.dataset.nome} — ${coloreNome} aggiunto al carrello.`);
    });
  });
}
