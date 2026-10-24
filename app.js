// Nome della chiave sotto cui salviamo tutto nel localStorage
const CHIAVE = 'auria.dati';

// Com'è fatto il "database" vuoto, la prima volta che apri l'app
function datiVuoti() {
  return {
    versione: 1,
    cicli: [],
    giorni: {},
    attacchi: [],
    impostazioni: { durataCiclo: 28, durataMestruazione: 5, blocco: { attivo: false } }
  };
}

function caricaDati() {
    let datiSalvati = localStorage.getItem(CHIAVE)
    if (datiSalvati === null){
        return datiVuoti();
    }
    else{
        return JSON.parse(datiSalvati);
    }
}

function salvaDati(dati) {
    let datiSalvati = JSON.stringify(dati);
    localStorage.setItem(CHIAVE, datiSalvati);
}

// All'avvio: carichiamo i dati e li teniamo in una variabile globale
let dati = caricaDati();
console.log('Dati caricati:', dati);