import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini e Condizioni — AerACADEMY",
};

export default function TermsPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <Link href="/login" className="privacy-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Torna indietro
        </Link>

        <div className="privacy-header">
          <h1>Termini e Condizioni</h1>
          <p>Ultimo aggiornamento: Marzo 2026</p>
        </div>

        <div className="privacy-body">
          <section>
            <h2>1. Accettazione dei Termini</h2>
            <p>
              Accedendo e utilizzando la piattaforma AerACADEMY (&quot;Servizio&quot;), fornita da AERABIM S.R.L.,
              l&apos;utente accetta di essere vincolato dai presenti Termini e Condizioni. Se non si accettano
              i presenti termini, si prega di non utilizzare il Servizio.
            </p>
          </section>

          <section>
            <h2>2. Descrizione del Servizio</h2>
            <p>
              AerACADEMY è una piattaforma di e-learning dedicata alla formazione professionale
              in ambito BIM (Building Information Modeling) e AEC (Architecture, Engineering, Construction).
              Il Servizio include:
            </p>
            <div className="privacy-list">
              <div className="privacy-list-item">Corsi video on-demand organizzati per aree tematiche e livelli</div>
              <div className="privacy-list-item">Quiz di valutazione e certificati di completamento</div>
              <div className="privacy-list-item">Tutor AI basato su Claude per assistenza durante lo studio</div>
              <div className="privacy-list-item">Dashboard personale per il tracciamento del progresso</div>
            </div>
          </section>

          <section>
            <h2>3. Account Utente</h2>
            <p>
              Per accedere al Servizio è necessario creare un account. L&apos;utente è responsabile della
              riservatezza delle proprie credenziali di accesso e di tutte le attività effettuate
              tramite il proprio account.
            </p>
            <p>
              L&apos;utente si impegna a fornire informazioni accurate e aggiornate durante la registrazione
              e a notificare tempestivamente qualsiasi uso non autorizzato del proprio account.
            </p>
          </section>

          <section>
            <h2>4. Acquisti e Pagamenti</h2>
            <p>
              I corsi possono essere acquistati singolarmente o tramite abbonamento. I pagamenti sono
              elaborati da Stripe Inc. in modo sicuro. AERABIM non memorizza i dati delle carte di pagamento.
            </p>
            <div className="privacy-list">
              <div className="privacy-list-item"><strong>Corsi singoli:</strong> l&apos;accesso è garantito a tempo indeterminato dalla data di acquisto</div>
              <div className="privacy-list-item"><strong>Abbonamenti:</strong> rinnovati automaticamente alla scadenza del periodo; cancellabili in qualsiasi momento dalla sezione Profilo</div>
              <div className="privacy-list-item"><strong>Rimborsi:</strong> è possibile richiedere un rimborso entro 14 giorni dall&apos;acquisto, se il corso non è stato completato per più del 20%</div>
            </div>
          </section>

          <section>
            <h2>5. Uso Consentito</h2>
            <p>L&apos;utente si impegna a non:</p>
            <div className="privacy-list">
              <div className="privacy-list-item">Utilizzare il Servizio per scopi illegali o non autorizzati</div>
              <div className="privacy-list-item">Tentare di accedere in modo non autorizzato ai sistemi della piattaforma</div>
              <div className="privacy-list-item">Condividere, redistribuire o rivendere i contenuti dei corsi</div>
              <div className="privacy-list-item">Registrare, scaricare o duplicare i video senza autorizzazione scritta</div>
              <div className="privacy-list-item">Interferire con il funzionamento del Servizio</div>
              <div className="privacy-list-item">Condividere le proprie credenziali con terzi</div>
            </div>
          </section>

          <section>
            <h2>6. Proprietà Intellettuale</h2>
            <p>
              Tutti i contenuti della piattaforma (video, testi, quiz, materiali didattici, grafica, software)
              sono di proprietà esclusiva di AERABIM S.R.L. o dei rispettivi autori e sono protetti
              dalle leggi sul diritto d&apos;autore e sulla proprietà intellettuale.
            </p>
            <p>
              L&apos;acquisto di un corso conferisce all&apos;utente una licenza personale, non trasferibile e
              non esclusiva, per la fruizione dei contenuti a scopo formativo.
            </p>
          </section>

          <section>
            <h2>7. Certificati</h2>
            <p>
              I certificati di completamento attestano il superamento dei quiz finali dei corsi.
              Ogni certificato include un codice di verifica univoco. I certificati sono rilasciati
              da AERABIM S.R.L. e non costituiscono titolo di studio o abilitazione professionale.
            </p>
          </section>

          <section>
            <h2>8. Tutor AI</h2>
            <p>
              Il tutor AI integrato utilizza il modello Claude di Anthropic PBC. Le conversazioni
              con il tutor sono elaborate dai server di Anthropic. Le risposte del tutor hanno
              carattere informativo e non sostituiscono la consulenza professionale.
            </p>
          </section>

          <section>
            <h2>9. Limitazione di Responsabilità</h2>
            <p>
              Il Servizio è fornito &quot;così com&apos;è&quot; (&quot;as-is&quot;). AERABIM non garantisce che il Servizio
              sia privo di errori o interruzioni. AERABIM non è responsabile per danni indiretti,
              incidentali o consequenziali derivanti dall&apos;utilizzo del Servizio.
            </p>
          </section>

          <section>
            <h2>10. Disponibilità del Servizio</h2>
            <p>
              AERABIM si impegna a garantire la massima disponibilità del Servizio, ma si riserva
              il diritto di sospendere temporaneamente l&apos;accesso per manutenzione, aggiornamenti
              o cause di forza maggiore, con preavviso quando possibile.
            </p>
          </section>

          <section>
            <h2>11. Modifiche ai Termini</h2>
            <p>
              AERABIM si riserva il diritto di modificare i presenti Termini e Condizioni.
              Le modifiche saranno comunicate tramite la piattaforma e/o via email.
              L&apos;uso continuato del Servizio dopo la comunicazione delle modifiche costituisce
              accettazione dei nuovi termini.
            </p>
          </section>

          <section>
            <h2>12. Legge Applicabile e Foro Competente</h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
              relativa all&apos;interpretazione o esecuzione dei presenti Termini, il foro competente
              è quello di Catania (CT), Italia.
            </p>
          </section>

          <div className="privacy-contact">
            <p><strong>Contatti</strong></p>
            <p>AERABIM S.R.L. — Catania (CT), Italia</p>
            <p>Email: <a href="mailto:info@aerabim.it">info@aerabim.it</a></p>
            <p>Web: <a href="https://www.aerabim.it" target="_blank" rel="noopener noreferrer">www.aerabim.it</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
