// Catalogo delle pelli (D-030 Parte 1.1): unica fonte per il tipo di pelle
// di ogni pezzo vendibile. Da oggi un pezzo è identificato da
// modello + colore + pelle, non più da modello + colore: a parità di
// modello e colore Stefano può usare pelli diverse (dato registrato:
// oltre alla capra conciata al vegetale, in laboratorio ci sono vitello
// liscio e vitello con pelo), e il cliente deve ricevere la pelle che ha
// visto in foto.
//
// Tutti i campi sono obbligatori. Dove il dato non è ancora arrivato da
// Stefano il campo resta VUOTO (mai inventato, mai "n.d.") e `confermata`
// resta false. Una pelle non confermata non può stare su un prodotto
// pubblicato: lo impedisce validaCatalogo() in prodotti.js, che fa
// fallire la build con un messaggio chiaro.
export const pelli = [
  {
    id: 'capra-vegetale',
    nome: 'Capra conciata al vegetale',
    specie: 'capra',
    finitura: 'naturale',
    concia: 'vegetale',
    spessore: '1,2-1,3 mm',
    // Una riga per la scheda prodotto (QG, D-030 § 1.1).
    descrizione: 'Concia lenta, senza protezioni chimiche: con l’uso cambia tono e diventa tua.',
    // Testo "Come si cura" già pubblicato, invariato (divieto 21): era
    // curaProdotto in prodotti.js, che oggi lo riesporta da qui.
    cura: {
      titolo: 'Come si cura',
      intro:
        'La pelle è conciata e tinta naturalmente, senza protezioni chimiche. È un materiale vivo: si segna, cambia tono e con l’uso diventa suo. Per farlo invecchiare bene:',
      punti: [
        'tienilo lontano dall’acqua — pioggia, schizzi, umidità',
        'evita creme, oli, unguenti e il contatto con il cibo',
        'non lasciarlo al sole né vicino a fonti di calore',
        'attenzione al contatto prolungato con indumenti di colore molto diverso: il colore può trasferirsi in entrambe le direzioni',
      ],
      chiusura: 'Conservalo in un luogo asciutto, al riparo dalla luce diretta.',
    },
    confermata: true,
  },
  {
    // Pelle dell'Essenziale (D-030 Parte 2): esterno a grana impressa,
    // interno liscio — l'unica cosa che si vede in foto. Nome pubblico,
    // specie, concia, spessore, descrizione e testo di cura arrivano da
    // Stefano: finché mancano restano vuoti e la pelle resta non
    // confermata. Quando arrivano, il QG consegna la riga completa e
    // `confermata` passa a true.
    id: 'grana-da-confermare',
    nome: '',
    specie: '',
    finitura: 'a grana impressa',
    concia: '',
    spessore: '',
    descrizione: '',
    cura: null,
    confermata: false,
  },
];

export function getPelle(id) {
  return pelli.find((p) => p.id === id);
}

// Pelli confermate, le sole che possono comparire in un filtro o su un
// prodotto pubblicato.
export function pelliConfermate() {
  return pelli.filter((p) => p.confermata);
}
