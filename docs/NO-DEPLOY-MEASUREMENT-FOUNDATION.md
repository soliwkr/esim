# No-deploy guard — GTM/GA4 foundation

Questa branch prepara codice e contratti, ma non autorizza un deploy pubblico.

Prima del deploy devono risultare verificati:

- CI completa verde;
- container GTM configurato ma non ancora pubblicato;
- Preview/Tag Assistant;
- assenza richieste Google prima del consenso;
- un solo page view dopo consenso;
- DebugView;
- revoca e reload;
- Privacy coerente;
- performance mobile e desktop.
