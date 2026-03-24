import { FaqAccordion } from '@/components/assistenza/FaqAccordion';
import { ContactForm } from '@/components/assistenza/ContactForm';
import type { FaqItem } from '@/components/assistenza/FaqAccordion';

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Come posso accedere ai corsi acquistati?',
    answer:
      'Dopo l\'acquisto, trovi i tuoi corsi nella sezione "I miei corsi" accessibile dal menu laterale. Clicca sul corso per iniziare a studiare.',
  },
  {
    question: 'Come funziona l\'abbonamento Pro?',
    answer:
      'L\'abbonamento Pro ti dà accesso illimitato a tutti i corsi della piattaforma per la durata dell\'abbonamento. Si rinnova automaticamente ogni anno. Puoi cancellarlo in qualsiasi momento dal tuo profilo.',
  },
  {
    question: 'Posso richiedere un rimborso?',
    answer:
      'Sì, puoi richiedere il rimborso di un acquisto singolo entro 14 giorni dalla data di acquisto (diritto di recesso UE). Vai nella sezione "Profilo", trova il corso nella cronologia acquisti e clicca "Richiedi rimborso".',
  },
  {
    question: 'Come ottengo il certificato di completamento?',
    answer:
      'Il certificato viene generato automaticamente quando completi tutte le lezioni e superi tutti i quiz del corso con un punteggio minimo del 70%. Lo trovi nella sezione "Certificati".',
  },
  {
    question: 'Il video non si carica o si blocca. Cosa faccio?',
    answer:
      'Prova a ricaricare la pagina. Se il problema persiste, verifica la tua connessione internet e prova con un altro browser. Se il problema continua, contattaci tramite il form qui sotto indicando il corso e la lezione.',
  },
  {
    question: 'Come cancello il mio abbonamento?',
    answer:
      'Vai su "Profilo" dal menu laterale. Nella sezione "Il tuo abbonamento" trovi il pulsante "Cancella abbonamento". L\'accesso ai corsi resta attivo fino alla fine del periodo già pagato.',
  },
  {
    question: 'Posso scaricare i video delle lezioni?',
    answer:
      'No, i video sono disponibili solo in streaming sulla piattaforma. Puoi però scaricare i materiali didattici allegati alle lezioni (slide, esercitazioni, documenti).',
  },
  {
    question: 'Come funzionano le sessioni live?',
    answer:
      'Le sessioni live (webinar e mentoring) sono riservate agli abbonati Pro. Puoi prenotarle dalla sezione "Sessioni Live". Riceverai una email di conferma e un promemoria un\'ora prima dell\'inizio.',
  },
  {
    question: 'Ho dimenticato la password. Come la recupero?',
    answer:
      'Nella pagina di login, clicca "Password dimenticata?" e inserisci la tua email. Riceverai un link per reimpostare la password. Il link è valido per 24 ore.',
  },
  {
    question: 'Come contatto il supporto?',
    answer:
      'Puoi contattarci compilando il form in fondo a questa pagina. Seleziona la categoria più appropriata e descrivi il tuo problema. Ti risponderemo il prima possibile via email.',
  },
];

export default function AssistenzaPage() {
  return (
    <div className="p-6 lg:p-9 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Assistenza</h1>
        <p className="text-sm text-text-muted mt-1">
          Consulta le domande frequenti o contattaci per ricevere aiuto.
        </p>
      </div>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-base font-medium text-text-primary mb-4">
          Domande frequenti
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* Divider */}
      <div className="border-t border-border-subtle mb-10" />

      {/* Contact Form Section */}
      <section>
        <h2 className="text-base font-medium text-text-primary mb-1">
          Contattaci
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Non hai trovato la risposta? Scrivici e ti risponderemo il prima possibile.
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
