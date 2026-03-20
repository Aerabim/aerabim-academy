import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AerACADEMY",
};

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p>Ultimo aggiornamento: Marzo 2026</p>
        </div>

        <div className="privacy-body">
          <section>
            <h2>1. Titolare del Trattamento</h2>
            <p>
              Il Titolare del trattamento dei dati personali è <strong>AERABIM S.R.L.</strong>,
              con sede legale a Catania (CT), Italia.
            </p>
            <p>
              Per qualsiasi comunicazione relativa al trattamento dei dati personali,
              è possibile contattarci all&apos;indirizzo email: <a href="mailto:info@aerabim.it">info@aerabim.it</a>.
            </p>
          </section>

          <section>
            <h2>2. Dati Raccolti</h2>
            <p>Nell&apos;ambito dell&apos;utilizzo della piattaforma AerACADEMY, raccogliamo le seguenti categorie di dati:</p>
            <div className="privacy-list">
              <div className="privacy-list-item">
                <strong>Dati di registrazione:</strong> nome e cognome, indirizzo email, ruolo professionale, azienda o ente di appartenenza, canale di provenienza.
              </div>
              <div className="privacy-list-item">
                <strong>Dati di utilizzo:</strong> corsi acquistati, progresso nelle lezioni, risultati dei quiz, certificati ottenuti, tempi di visualizzazione.
              </div>
              <div className="privacy-list-item">
                <strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema operativo, dati di log, cookie tecnici necessari al funzionamento del servizio.
              </div>
              <div className="privacy-list-item">
                <strong>Dati di pagamento:</strong> le transazioni sono gestite da Stripe Inc. AERABIM non memorizza dati di carte di credito.
              </div>
            </div>
          </section>

          <section>
            <h2>3. Finalità del Trattamento</h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <div className="privacy-list">
              <div className="privacy-list-item">Creazione e gestione dell&apos;account utente</div>
              <div className="privacy-list-item">Erogazione dei corsi e tracciamento del progresso formativo</div>
              <div className="privacy-list-item">Elaborazione dei pagamenti e gestione degli abbonamenti</div>
              <div className="privacy-list-item">Emissione dei certificati di completamento</div>
              <div className="privacy-list-item">Funzionamento del tutor AI integrato nella piattaforma</div>
              <div className="privacy-list-item">Comunicazioni di servizio relative all&apos;account e ai corsi</div>
              <div className="privacy-list-item">Miglioramento del servizio e analisi statistiche aggregate</div>
            </div>
          </section>

          <section>
            <h2>4. Base Giuridica</h2>
            <p>
              Il trattamento dei dati è fondato sull&apos;esecuzione del contratto di servizio (Art. 6(1)(b) GDPR),
              sul consenso dell&apos;utente (Art. 6(1)(a) GDPR) e sul legittimo interesse del Titolare (Art. 6(1)(f) GDPR)
              per finalità di miglioramento del servizio.
            </p>
          </section>

          <section>
            <h2>5. Conservazione dei Dati</h2>
            <p>
              I dati personali sono conservati per il tempo necessario alle finalità per cui sono stati raccolti,
              e in ogni caso non oltre 24 mesi dalla cessazione dell&apos;account. I dati relativi ai certificati
              sono conservati a tempo indeterminato per finalità di verifica.
            </p>
          </section>

          <section>
            <h2>6. Condivisione con Terze Parti</h2>
            <p>I dati possono essere condivisi con i seguenti responsabili del trattamento:</p>
            <div className="privacy-list">
              <div className="privacy-list-item"><strong>Supabase Inc.</strong> — Autenticazione e database</div>
              <div className="privacy-list-item"><strong>Stripe Inc.</strong> — Elaborazione pagamenti</div>
              <div className="privacy-list-item"><strong>Mux Inc.</strong> — Streaming video</div>
              <div className="privacy-list-item"><strong>Vercel Inc.</strong> — Hosting della piattaforma</div>
              <div className="privacy-list-item"><strong>Anthropic PBC</strong> — Funzionalità AI Tutor (le conversazioni con il tutor sono elaborate da Anthropic)</div>
              <div className="privacy-list-item"><strong>Resend Inc.</strong> — Invio email transazionali</div>
            </div>
          </section>

          <section>
            <h2>7. Diritti dell&apos;Utente</h2>
            <p>In conformità al GDPR, l&apos;utente ha diritto a:</p>
            <div className="privacy-list">
              <div className="privacy-list-item">Accedere ai propri dati personali</div>
              <div className="privacy-list-item">Richiedere la rettifica dei dati inesatti</div>
              <div className="privacy-list-item">Richiedere la cancellazione dei dati (&quot;diritto all&apos;oblio&quot;)</div>
              <div className="privacy-list-item">Richiedere la portabilità dei dati</div>
              <div className="privacy-list-item">Opporsi al trattamento per motivi legittimi</div>
              <div className="privacy-list-item">Revocare il consenso in qualsiasi momento</div>
            </div>
            <p>
              Per esercitare i propri diritti, è possibile inviare una richiesta a{" "}
              <a href="mailto:info@aerabim.it">info@aerabim.it</a>.
            </p>
          </section>

          <section>
            <h2>8. Sicurezza</h2>
            <p>
              AERABIM adotta misure tecniche e organizzative adeguate per proteggere i dati personali,
              tra cui crittografia in transito (TLS) e a riposo, autenticazione sicura e controlli di accesso.
            </p>
          </section>

          <section>
            <h2>9. Cookie</h2>
            <p>
              La piattaforma utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio
              (autenticazione, preferenze di sessione). Non vengono utilizzati cookie di profilazione
              o di terze parti per finalità pubblicitarie.
            </p>
          </section>

          <section>
            <h2>10. Modifiche alla Policy</h2>
            <p>
              AERABIM si riserva il diritto di modificare la presente Privacy Policy. Eventuali modifiche
              saranno comunicate tramite la piattaforma e/o via email. La data dell&apos;ultimo aggiornamento
              è indicata in alto.
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
